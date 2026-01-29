const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');
const fs = require('fs');

// --- CONFIGURATION ---
// IMPORTANT: Set your AWS Region
const REGION = 'us-west-1'; // Updated based on your aws-exports.js

async function main() {
    process.env.AWS_SDK_LOAD_CONFIG = "1"; // Load shared config (~/.aws/credentials)

    // Initialize DB
    const client = new DynamoDBClient({ region: REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    console.log(`🔍 Scanning for tables in region: ${REGION}...`);

    // We need to list tables to find the actual names
    const tables = await listTables(client);

    // Debug: Print all tables found to help troubleshoot
    console.log("DEBUG: Found tables:");
    tables.forEach(t => console.log(" - " + t));

    // Helper to find table by prefix
    // We assume the table names contain the model name and 'rickshareah' or allow looser matching if environment is different
    const findTable = (modelName) => tables.find(t => t.includes(modelName) && (t.includes('rickshareah') || t.includes('dev')));

    const TABLE_COUPLE = tables.find(t => t.includes('Couple-'));
    // Group matches 'Group-' but NOT 'GroupMember-'
    const TABLE_GROUP = tables.find(t => t.includes('Group-') && !t.includes('GroupMember-'));
    const TABLE_GROUP_MEMBER = tables.find(t => t.includes('GroupMember-'));
    const TABLE_EXPENSE = tables.find(t => t.includes('Expense-'));
    const TABLE_SETTLEMENT = tables.find(t => t.includes('Settlement-'));

    if (!TABLE_COUPLE || !TABLE_GROUP || !TABLE_GROUP_MEMBER || !TABLE_EXPENSE || !TABLE_SETTLEMENT) {
        console.error("❌ Could not find all required tables.");
        console.log("Identified Tables:", {
            Couple: TABLE_COUPLE || 'MISSING',
            Group: TABLE_GROUP || 'MISSING',
            GroupMember: TABLE_GROUP_MEMBER || 'MISSING',
            Expense: TABLE_EXPENSE || 'MISSING',
            Settlement: TABLE_SETTLEMENT || 'MISSING'
        });
        console.log("Ensure you run 'amplify push' first to create the new tables!");
        return;
    }

    console.log("✅ All required tables found.");
    console.log(`   Couple: ${TABLE_COUPLE}`);
    console.log(`   Group: ${TABLE_GROUP}`);
    // ... rest of logging

    // 0. SAFETY BACKUP
    console.log("\n💾 Creating Safety Backup...");
    let couples = [];
    let expenses = [];
    let settlements = [];

    try {
        couples = await scanAll(docClient, TABLE_COUPLE);
        expenses = await scanAll(docClient, TABLE_EXPENSE);
        settlements = await scanAll(docClient, TABLE_SETTLEMENT);
    } catch (e) {
        console.error("Error backing up data:", e);
        return;
    }

    const backupData = {
        timestamp: new Date().toISOString(),
        couples,
        expenses,
        settlements
    };

    const backupFile = `backup-${Date.now()}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`   ✅ Backup saved to ${backupFile}. Use this if anything goes wrong!`);
    console.log(`      (Note: Your DynamoDB 'Couple' table is also preserved securely on AWS)`);

    // 1. Migrate Couples -> Groups
    console.log("\n🚀 Migrating Couples to Groups...");

    console.log(`   Found ${couples.length} couples.`);

    const coupleToGroupMap = {}; // oldCoupleId -> newGroupId

    for (const couple of couples) {
        // Check if already migrated? (Maybe check if Group exists with same ID? Let's assume we reuse ID!)
        const newGroupId = couple.id; // Reuse ID for simplicity
        coupleToGroupMap[couple.id] = newGroupId;

        console.log(`   Processing Couple: ${couple.name} (${couple.id})`);

        // Create Group
        const groupItem = {
            id: newGroupId,
            type: 'COUPLE', // Maintain semantic type, but stored in Group table
            name: couple.name,
            inviteCode: couple.inviteCode,
            createdAt: couple.createdAt,
            updatedAt: new Date().toISOString(),
            __typename: 'Group',
            owner: couple.owner // preserve owner
        };

        try {
            await docClient.send(new PutCommand({
                TableName: TABLE_GROUP,
                Item: groupItem
            }));
            process.stdout.write(".");
        } catch (e) {
            console.error(`\nFailed to create group ${newGroupId}:`, e.message);
        }

        // Create GroupMembers
        const members = [
            { id: couple.partner1Id, name: couple.partner1Name, email: couple.partner1Email },
            { id: couple.partner2Id, name: couple.partner2Name, email: couple.partner2Email },
        ];

        for (const m of members) {
            if (!m.id) continue;

            const memberId = crypto.randomUUID();

            const memberItem = {
                id: memberId,
                groupId: newGroupId,
                userId: m.id,
                name: m.name || 'Member',
                email: m.email,
                role: m.id === couple.owner ? 'owner' : 'member', // Best guess
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                __typename: 'GroupMember',
                owner: m.id
            };

            try {
                await docClient.send(new PutCommand({
                    TableName: TABLE_GROUP_MEMBER,
                    Item: memberItem
                }));
                process.stdout.write("m");
            } catch (e) {
                console.error(`\nFailed to create member ${m.id}:`, e.message);
            }
        }
    }
    console.log("\n   Couples migrated.");

    // 2. Migrate Expenses
    console.log("\n🚀 Migrating Expenses...");
    console.log(`   Found ${expenses.length} expenses.`);

    let expCount = 0;
    for (const exp of expenses) {
        if (!exp.coupleId) continue; // Already migrated or invalid
        if (exp.groupId) continue; // Already migrated

        const newGroupId = coupleToGroupMap[exp.coupleId];
        if (!newGroupId) {
            console.warn(`   Skipping expense ${exp.id}: Couple ${exp.coupleId} not found in map.`);
            continue;
        }

        // Calculate 'shares' if missing
        let shares = exp.shares;

        if (!shares) {
            const couple = couples.find(c => c.id === exp.coupleId);
            if (couple) {
                const shareMap = {};
                const p1 = exp.partner1Share || 0;
                const p2 = exp.partner2Share || 0;

                // Fallback if 0/0 and equal?
                if (p1 === 0 && p2 === 0 && exp.splitType === 'equal') {
                    const half = Math.round(exp.amount / 2);
                    shareMap[couple.partner1Id] = half;
                    shareMap[couple.partner2Id] = exp.amount - half;
                } else {
                    shareMap[couple.partner1Id] = p1;
                    shareMap[couple.partner2Id] = p2;
                }
                shares = JSON.stringify(shareMap);
            }
        }

        // Update Item
        try {
            await docClient.send(new UpdateCommand({
                TableName: TABLE_EXPENSE,
                Key: { id: exp.id },
                UpdateExpression: "SET groupId = :gid, shares = :s",
                ExpressionAttributeValues: {
                    ":gid": newGroupId,
                    ":s": shares
                }
            }));
            process.stdout.write(".");
            expCount++;
        } catch (e) {
            console.error(`\nFailed to update expense ${exp.id}:`, e.message);
        }
    }
    console.log(`\n   ${expCount} Expenses migrated.`);

    // 3. Migrate Settlements
    console.log("\n🚀 Migrating Settlements...");
    console.log(`   Found ${settlements.length} settlements.`);

    let setCount = 0;
    for (const set of settlements) {
        if (!set.coupleId) continue;
        if (set.groupId) continue;

        const newGroupId = coupleToGroupMap[set.coupleId];
        if (!newGroupId) continue;

        try {
            await docClient.send(new UpdateCommand({
                TableName: TABLE_SETTLEMENT,
                Key: { id: set.id },
                UpdateExpression: "SET groupId = :gid",
                ExpressionAttributeValues: {
                    ":gid": newGroupId
                }
            }));
            process.stdout.write(".");
            setCount++;
        } catch (e) {
            console.error(`\nFailed to update settlement ${set.id}:`, e.message);
        }
    }
    console.log(`\n   ${setCount} Settlements migrated.`);

    console.log("\n🎉 Migration Complete!");
}

// --- HELPERS ---

async function listTables(client) {
    let tables = [];
    let lastEvaluatedTableName = undefined;

    do {
        const cmd = new ListTablesCommand({ ExclusiveStartTableName: lastEvaluatedTableName });
        const res = await client.send(cmd);
        tables = [...tables, ...(res.TableNames || [])];
        lastEvaluatedTableName = res.LastEvaluatedTableName;
    } while (lastEvaluatedTableName);

    return tables;
}

async function scanAll(docClient, tableName) {
    let items = [];
    let lastKey = undefined;
    do {
        const cmd = new ScanCommand({ TableName: tableName, ExclusiveStartKey: lastKey });
        const res = await docClient.send(cmd);
        items = [...items, ...(res.Items || [])];
        lastKey = res.LastEvaluatedKey;
    } while (lastKey);
    return items;
}

main().catch(console.error);
