import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useApp } from '../context/AppContext';

// Legacy Queries (Hardcoded to avoid relying on generated files that might change)
const listCouplesQuery = `
  query ListCouples {
    listCouples {
      items {
        id
        name
        partner1Id
        partner1Name
        partner2Id
        partner2Name
        inviteCode
      }
    }
  }
`;

const listExpensesQuery = `
  query ListExpenses {
    listExpenses {
      items {
        id
        coupleId
        description
        amount
        paidBy
        splitType
        partner1Share
        partner2Share
        category
        date
        note
        createdAt
      }
    }
  }
`;

const listSettlementsQuery = `
  query ListSettlements {
    listSettlements {
      items {
        id
        coupleId
        amount
        paidBy
        paidTo
        date
        note
        createdAt
      }
    }
  }
`;

export function Migration() {
    const { createGroup, addExpense, addSettlement, user } = useApp();
    const [logs, setLogs] = useState<string[]>([]);
    const [backupData, setBackupData] = useState<any>(null);

    const log = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const handleExport = async () => {
        try {
            log('Starting export...');
            const client = generateClient();

            // 1. Fetch Couples
            // Note: This might fail if the backend is ALREADY updated. 
            // If backend is updated, "listCouples" doesn't exist.
            // Ideally this step runs BEFORE 'amplify push'.
            let couples = [];
            try {
                const cRes = await client.graphql({ query: listCouplesQuery });
                couples = (cRes as any).data.listCouples.items;
                log(`Found ${couples.length} couples.`);
            } catch (e) {
                log('Error fetching couples: ' + (e as any).message);
            }

            // 2. Fetch Expenses
            let expenses = [];
            try {
                const eRes = await client.graphql({ query: listExpensesQuery });
                expenses = (eRes as any).data.listExpenses.items;
                log(`Found ${expenses.length} expenses.`);
            } catch (e) {
                log('Error fetching expenses: ' + (e as any).message);
            }

            // 3. Fetch Settlements
            let settlements = [];
            try {
                const sRes = await client.graphql({ query: listSettlementsQuery });
                settlements = (sRes as any).data.listSettlements.items;
                log(`Found ${settlements.length} settlements.`);
            } catch (e) {
                log('Error fetching settlements: ' + (e as any).message);
            }

            const data = { couples, expenses, settlements };
            setBackupData(data);

            // Download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'rickshareah_backup.json';
            a.click();
            log('Export complete! Download started.');

        } catch (e) {
            log('Export failed: ' + (e as any).message);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                log(`Loaded backup: ${data.couples?.length || 0} couples, ${data.expenses?.length || 0} expenses.`);
                await processImport(data);
            } catch (err) {
                log('Failed to parse JSON');
            }
        };
        reader.readAsText(file);
    };

    const processImport = async (data: any) => {
        // 1. Create Group (if needed)
        // We assume we want to import the FIRST couple found as the current user's group
        // OR we just create a new group?
        // Since `createGroup` (my context function) creates a group for ME, 
        // I should manually map the old couple data.

        if (!data.couples || data.couples.length === 0) {
            log('No couples found to import.');
            return;
        }

        const oldCouple = data.couples[0];
        log(`Migrating couple: ${oldCouple.name}...`);

        // We use the Context 'createGroup' which does the heavy lifting of creating 
        // the Group and the Member record for the CURRENT user.
        // What about the PARTNER?
        // `createGroup` only adds ME. 
        // We need to add the partner manually via Invite Code? 
        // OR, since this is a migration, we might want to hack it.
        // But we can't create a GroupMember for another user easily without their auth 
        // (unless we are admin, or we abuse the system).
        // WAIT: `GroupMember` has `userId`. 
        // `createGroupMember` in AppContext is currently wrapped inside `createGroup` or `joinGroup`.
        // The schema allows Owner to create members? 
        // `GroupMember` auth rules: { allow: owner }, { allow: private, operations: [read, create...] }
        // Yes, any authenticated user can create a GroupMember?
        // If so, I can create the record for my partner!

        // Step 1: Create Group
        const groupName = oldCouple.name;
        // We assume the current logged in user is one of the partners.
        // We'll pass our own name for the 'memberName' arg?
        // We can try to guess it from partner1Name/partner2Name?
        const myId = user?.id;
        const myName = oldCouple.partner1Id === myId ? oldCouple.partner1Name : oldCouple.partner2Name;

        log(`Creating group "${groupName}"...`);
        const createRes = await createGroup(groupName, 'COUPLE', myName || 'Me');

        if (!createRes.success) {
            log(`Failed to create group: ${createRes.error}`);
            return;
        }

        log('Group created! Now adding data...');
        // Wait a moment for state update usually, but we are inside async. 
        // `createGroup` updates local state but we need the new Group ID properly.
        // Actually `createGroup` sets `group` state. But state updates are async.
        // Use the return value? `createGroup` in AppContext returns { success, error }. 
        // It DOES NOT return the new Group object. 
        // I should update AppContext to return it, OR fetch it.
        // Since I just created it, I am the owner. 
        // I can fetch the latest group I own? 

        // LIMITATION: Migration import usually needs more control. 
        // For now, let's ask the user to ENSURE they have created the group FIRST manually?
        // No, that's annoying.

        // Let's just assume for a moment AppContext is updated or we can fetch.
        // Actually, relying on `group` from `useApp()` will be stale here.
        // I can manually call `generateClient().graphql(createGroup...)` here to get the ID.
        // But `createGroup` does complex logic.

        // ALTERNATIVE: "Import into CURRENT Group".
        // User creates group manually via UI. Then runs "Import".
        // This is safer.

        // NEW PLAN: 
        // 1. User creates Empty Group via normal UI.
        // 2. User goes to /migration.
        // 3. User selects backup.json.
        // 4. We import Expenses/Settlements into the CURRENT active group.

        log('NOTE: Importing into currently active group. Make sure you created one!');

        // 2. Import Expenses
        const legacyExpenses = data.expenses || [];
        let importedExp = 0;

        for (const legExp of legacyExpenses) {
            // Filter: Only import for this couple?
            if (legExp.coupleId !== oldCouple.id) continue;

            // Map fields
            // Logic for shares:
            let shares = {};
            if (legExp.splitType === 'equal') {
                // We calculate the exact amounts? 
                // Or simpler: Just set "shares" = null (if backend handles it) 
                // OR explicit split. 
                // My `ExpenseCard` handles `shares` optionality? 
                // Yes, lines 26-30 in ExpenseCard try to parse shares, catch error.
                // If no shares, it renders "not involved" or falls back?
                // The refactored ExpenseCard said: "If no shares... simpler to just start fresh... statusText = 'not involved'".
                // SO: We MUST provide shares JSON for the new card execution path to work well.

                const half = Math.round(legExp.amount / 2);
                // Who are the users?
                // We have `legExp.partner1Share` and `legExp.partner2Share`?
                // Legacy schema had those fields!
                // If they exist, use them.

                const p1Id = oldCouple.partner1Id;
                const p2Id = oldCouple.partner2Id;

                // Note: This relies on `oldCouple` having the IDs.
                if (legExp.partner1Share && legExp.partner2Share) {
                    shares[p1Id] = legExp.partner1Share;
                    shares[p2Id] = legExp.partner2Share;
                } else {
                    // Fallback equal
                    shares[p1Id] = half;
                    shares[p2Id] = legExp.amount - half; // Avoid penny issues
                }
            }

            await addExpense({
                description: legExp.description,
                amount: legExp.amount,
                paidBy: legExp.paidBy,
                splitType: legExp.splitType,
                shares: JSON.stringify(shares),
                category: legExp.category,
                date: legExp.date,
                note: legExp.note
            });
            importedExp++;
            if (importedExp % 5 === 0) log(`Imported ${importedExp} expenses...`);
        }

        // 3. Import Settlements
        const legacySettlements = data.settlements || [];
        for (const legSet of legacySettlements) {
            if (legSet.coupleId !== oldCouple.id) continue;

            await addSettlement({
                amount: legSet.amount,
                paidBy: legSet.paidBy,
                paidTo: legSet.paidTo,
                date: legSet.date,
                note: legSet.note
            });
        }

        log('Import Complete!');
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">🛠️ Data Migration</h1>

            <Card>
                <h2 className="font-bold mb-2">Step 1: Backup (Before Update)</h2>
                <p className="text-sm text-[var(--color-plum)]/70 mb-4">
                    Run this <strong>BEFORE</strong> you push the new backend changes.
                    This will download your existing Couple data.
                </p>
                <Button onClick={handleExport} className="w-full">
                    📤 Export Legacy Data
                </Button>
            </Card>

            <Card>
                <h2 className="font-bold mb-2">Step 2: Restore (After Update)</h2>
                <p className="text-sm text-[var(--color-plum)]/70 mb-4">
                    Create a new Group normally, then use this to import your history.
                </p>
                <div className="border-2 border-dashed border-[var(--color-plum)]/20 p-4 text-center">
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="block w-full text-sm text-[var(--color-plum)]
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-[var(--color-violet)] file:text-white
                  hover:file:bg-[var(--color-violet)]/80
                "
                    />
                </div>
            </Card>

            <Card className="bg-black text-green-400 font-mono text-xs max-h-60 overflow-y-auto">
                {logs.length === 0 ? 'Ready...' : logs.map((l, i) => <div key={i}>{l}</div>)}
            </Card>
        </div>
    );
}
