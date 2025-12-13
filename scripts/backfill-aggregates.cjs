/**
 * One-time backfill script to:
 * 1. Populate 'owners' arrays on Couple, Expense, and Settlement records
 * 2. Calculate aggregates for existing couples
 * 
 * This script should be run after deploying the multi-owner auth backend changes.
 * 
 * Usage:
 *   1. Set up AWS credentials (e.g., via AWS_PROFILE or environment variables)
 *   2. Update the TABLE_NAMES below with your actual table names
 *   3. Run: node scripts/backfill-aggregates.cjs
 * 
 * Note: After initial backfill, the Lambda write service will keep aggregates
 * and owners up-to-date automatically.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand, UpdateCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

// Configuration - UPDATE THESE WITH YOUR ACTUAL TABLE NAMES
const CONFIG = {
  region: process.env.AWS_REGION || 'us-west-1',
  // Table names follow pattern: ModelName-{apiId}-{env}
  // Find these in your AWS Console > DynamoDB > Tables
  coupleTableName: process.env.COUPLE_TABLE || 'Couple-XXXXXX-dev',
  expenseTableName: process.env.EXPENSE_TABLE || 'Expense-XXXXXX-dev',
  settlementTableName: process.env.SETTLEMENT_TABLE || 'Settlement-XXXXXX-dev',
  // Dry run mode - set to false to actually make changes
  dryRun: process.env.DRY_RUN !== 'false',
};

const client = new DynamoDBClient({ region: CONFIG.region });
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Build owners array from couple record
 */
function buildOwnersArray(couple) {
  const owners = [];
  if (couple.partner1Id) {
    owners.push(couple.partner1Id);
  }
  if (couple.partner2Id) {
    owners.push(couple.partner2Id);
  }
  return owners;
}

/**
 * Calculate net balance from expenses
 * Uses the same logic as the Lambda write service
 */
function calculateNetBalance(partner1TotalPaid, partner2TotalPaid, partner1TotalOwes, partner2TotalOwes) {
  const partner1Credit = partner1TotalPaid - partner1TotalOwes;
  const partner2Credit = partner2TotalPaid - partner2TotalOwes;
  return partner1Credit - partner2Credit;
}

/**
 * Calculate aggregates from expenses and settlements
 */
function calculateAggregates(expenses, settlements, couple) {
  let partner1TotalPaid = 0;
  let partner2TotalPaid = 0;
  let partner1TotalOwes = 0;
  let partner2TotalOwes = 0;

  for (const expense of expenses) {
    // Determine if paidBy is partner1 (by id or name)
    const isPaidByPartner1 = 
      expense.paidBy === couple.partner1Id || 
      expense.paidBy === couple.partner1Name ||
      expense.paidBy === 'partner1';
    
    if (isPaidByPartner1) {
      partner1TotalPaid += expense.amount;
    } else {
      partner2TotalPaid += expense.amount;
    }
    
    partner1TotalOwes += expense.partner1Share || 0;
    partner2TotalOwes += expense.partner2Share || 0;
  }

  const netBalance = calculateNetBalance(
    partner1TotalPaid, 
    partner2TotalPaid, 
    partner1TotalOwes, 
    partner2TotalOwes
  );

  return {
    expenseCount: expenses.length,
    settlementCount: settlements.length,
    partner1TotalPaid,
    partner2TotalPaid,
    partner1TotalOwes,
    partner2TotalOwes,
    netBalance,
    lastCalculatedAt: new Date().toISOString(),
  };
}

/**
 * Get all couples from DynamoDB
 */
async function getAllCouples() {
  const items = [];
  let lastEvaluatedKey = undefined;

  do {
    const result = await docClient.send(new ScanCommand({
      TableName: CONFIG.coupleTableName,
      ExclusiveStartKey: lastEvaluatedKey,
    }));

    if (result.Items) {
      items.push(...result.Items);
    }
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

/**
 * Query all expenses for a couple
 */
async function getExpensesForCouple(coupleId) {
  const items = [];
  let lastEvaluatedKey = undefined;

  do {
    const result = await docClient.send(new QueryCommand({
      TableName: CONFIG.expenseTableName,
      IndexName: 'byCouple',
      KeyConditionExpression: 'coupleId = :coupleId',
      ExpressionAttributeValues: {
        ':coupleId': coupleId,
      },
      ExclusiveStartKey: lastEvaluatedKey,
    }));

    if (result.Items) {
      items.push(...result.Items);
    }
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

/**
 * Query all settlements for a couple
 */
async function getSettlementsForCouple(coupleId) {
  const items = [];
  let lastEvaluatedKey = undefined;

  do {
    const result = await docClient.send(new QueryCommand({
      TableName: CONFIG.settlementTableName,
      IndexName: 'byCouple',
      KeyConditionExpression: 'coupleId = :coupleId',
      ExpressionAttributeValues: {
        ':coupleId': coupleId,
      },
      ExclusiveStartKey: lastEvaluatedKey,
    }));

    if (result.Items) {
      items.push(...result.Items);
    }
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

/**
 * Update couple with owners and aggregates
 */
async function updateCouple(coupleId, owners, aggregates) {
  if (CONFIG.dryRun) {
    console.log(`  [DRY RUN] Would update couple with owners=${JSON.stringify(owners)}, netBalance=${aggregates.netBalance}`);
    return;
  }

  await docClient.send(new UpdateCommand({
    TableName: CONFIG.coupleTableName,
    Key: { id: coupleId },
    UpdateExpression: `
      SET #owners = :owners,
          expenseCount = :expenseCount,
          settlementCount = :settlementCount,
          partner1TotalPaid = :partner1TotalPaid,
          partner2TotalPaid = :partner2TotalPaid,
          partner1TotalOwes = :partner1TotalOwes,
          partner2TotalOwes = :partner2TotalOwes,
          netBalance = :netBalance,
          lastCalculatedAt = :lastCalculatedAt,
          updatedAt = :updatedAt
    `,
    ExpressionAttributeNames: {
      '#owners': 'owners',
    },
    ExpressionAttributeValues: {
      ':owners': owners,
      ':expenseCount': aggregates.expenseCount,
      ':settlementCount': aggregates.settlementCount,
      ':partner1TotalPaid': aggregates.partner1TotalPaid,
      ':partner2TotalPaid': aggregates.partner2TotalPaid,
      ':partner1TotalOwes': aggregates.partner1TotalOwes,
      ':partner2TotalOwes': aggregates.partner2TotalOwes,
      ':netBalance': aggregates.netBalance,
      ':lastCalculatedAt': aggregates.lastCalculatedAt,
      ':updatedAt': new Date().toISOString(),
    },
  }));
}

/**
 * Update expense with owners array
 */
async function updateExpenseOwners(expenseId, owners) {
  if (CONFIG.dryRun) {
    console.log(`    [DRY RUN] Would update expense ${expenseId} with owners=${JSON.stringify(owners)}`);
    return;
  }

  await docClient.send(new UpdateCommand({
    TableName: CONFIG.expenseTableName,
    Key: { id: expenseId },
    UpdateExpression: 'SET #owners = :owners, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#owners': 'owners',
    },
    ExpressionAttributeValues: {
      ':owners': owners,
      ':updatedAt': new Date().toISOString(),
    },
  }));
}

/**
 * Update settlement with owners array
 */
async function updateSettlementOwners(settlementId, owners) {
  if (CONFIG.dryRun) {
    console.log(`    [DRY RUN] Would update settlement ${settlementId} with owners=${JSON.stringify(owners)}`);
    return;
  }

  await docClient.send(new UpdateCommand({
    TableName: CONFIG.settlementTableName,
    Key: { id: settlementId },
    UpdateExpression: 'SET #owners = :owners, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#owners': 'owners',
    },
    ExpressionAttributeValues: {
      ':owners': owners,
      ':updatedAt': new Date().toISOString(),
    },
  }));
}

/**
 * Main backfill function
 */
async function backfillAll() {
  console.log('='.repeat(70));
  console.log('Backfill Script: Owners + Aggregates');
  console.log('='.repeat(70));
  console.log('Configuration:');
  console.log(`  Region: ${CONFIG.region}`);
  console.log(`  Couple Table: ${CONFIG.coupleTableName}`);
  console.log(`  Expense Table: ${CONFIG.expenseTableName}`);
  console.log(`  Settlement Table: ${CONFIG.settlementTableName}`);
  console.log(`  Dry Run: ${CONFIG.dryRun}`);
  if (CONFIG.dryRun) {
    console.log('\n  *** DRY RUN MODE - No changes will be made ***');
    console.log('  Set DRY_RUN=false to apply changes\n');
  }
  console.log('');

  // Validate table names
  if (CONFIG.coupleTableName.includes('XXXXXX')) {
    console.error('ERROR: Please update CONFIG with your actual table names!');
    console.error('Find them in AWS Console > DynamoDB > Tables');
    process.exit(1);
  }

  try {
    console.log('Fetching all couples...');
    const couples = await getAllCouples();
    console.log(`Found ${couples.length} couple(s) to process\n`);

    let coupleSuccessCount = 0;
    let coupleErrorCount = 0;
    let expenseUpdateCount = 0;
    let settlementUpdateCount = 0;

    for (let i = 0; i < couples.length; i++) {
      const couple = couples[i];
      const coupleId = couple.id;
      const coupleName = couple.name || 'Unknown';

      console.log(`[${i + 1}/${couples.length}] Processing: ${coupleName} (${coupleId})`);

      try {
        // Build owners array
        const owners = buildOwnersArray(couple);
        console.log(`  Partners: ${couple.partner1Id || 'none'}, ${couple.partner2Id || 'none'}`);
        console.log(`  Owners array: ${JSON.stringify(owners)}`);

        // Fetch expenses and settlements
        const [expenses, settlements] = await Promise.all([
          getExpensesForCouple(coupleId),
          getSettlementsForCouple(coupleId),
        ]);

        console.log(`  Found ${expenses.length} expenses, ${settlements.length} settlements`);

        // Calculate aggregates
        const aggregates = calculateAggregates(expenses, settlements, couple);
        console.log(`  Aggregates: netBalance=${aggregates.netBalance}, p1Paid=${aggregates.partner1TotalPaid}, p2Paid=${aggregates.partner2TotalPaid}`);

        // Update couple with owners and aggregates
        await updateCouple(coupleId, owners, aggregates);

        // Update expenses with owners
        let expensesNeedingUpdate = 0;
        for (const expense of expenses) {
          if (!expense.owners || JSON.stringify(expense.owners) !== JSON.stringify(owners)) {
            await updateExpenseOwners(expense.id, owners);
            expensesNeedingUpdate++;
            expenseUpdateCount++;
          }
        }
        if (expensesNeedingUpdate > 0) {
          console.log(`  Updated owners on ${expensesNeedingUpdate} expenses`);
        }

        // Update settlements with owners
        let settlementsNeedingUpdate = 0;
        for (const settlement of settlements) {
          if (!settlement.owners || JSON.stringify(settlement.owners) !== JSON.stringify(owners)) {
            await updateSettlementOwners(settlement.id, owners);
            settlementsNeedingUpdate++;
            settlementUpdateCount++;
          }
        }
        if (settlementsNeedingUpdate > 0) {
          console.log(`  Updated owners on ${settlementsNeedingUpdate} settlements`);
        }

        console.log('  ✓ Completed successfully\n');
        coupleSuccessCount++;
      } catch (error) {
        console.error(`  ✗ Error: ${error.message}\n`);
        coupleErrorCount++;
      }
    }

    console.log('='.repeat(70));
    console.log('Backfill Complete!');
    console.log(`  Couples processed: ${coupleSuccessCount} success, ${coupleErrorCount} errors`);
    console.log(`  Expenses updated: ${expenseUpdateCount}`);
    console.log(`  Settlements updated: ${settlementUpdateCount}`);
    if (CONFIG.dryRun) {
      console.log('\n  *** This was a DRY RUN - no actual changes were made ***');
      console.log('  Run with DRY_RUN=false to apply changes');
    }
    console.log('='.repeat(70));

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
backfillAll();
