/**
 * One-time backfill script to calculate aggregates for existing couples.
 * 
 * This script should be run after deploying the backend changes to populate
 * the pre-computed aggregate fields (expenseCount, settlementCount, netBalance, etc.)
 * for all existing couples.
 * 
 * Usage:
 *   1. Set up AWS credentials (e.g., via AWS_PROFILE or environment variables)
 *   2. Update the TABLE_NAMES below with your actual table names
 *   3. Run: node scripts/backfill-aggregates.cjs
 * 
 * Note: After initial backfill, the DynamoDB stream triggers will keep aggregates
 * up-to-date automatically.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

// Configuration - UPDATE THESE WITH YOUR ACTUAL TABLE NAMES
const CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  // Table names follow pattern: ModelName-{apiId}-{env}
  // Find these in your AWS Console > DynamoDB > Tables
  coupleTableName: process.env.COUPLE_TABLE || 'Couple-XXXXXX-dev',
  expenseTableName: process.env.EXPENSE_TABLE || 'Expense-XXXXXX-dev',
  settlementTableName: process.env.SETTLEMENT_TABLE || 'Settlement-XXXXXX-dev',
};

const client = new DynamoDBClient({ region: CONFIG.region });
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Calculate what each partner owes for an expense
 */
function calculateExpenseSplit(expense) {
  if (expense.splitType === 'equal') {
    const half = Math.floor(expense.amount / 2);
    const remainder = expense.amount % 2;
    return {
      partner1Owes: half + (expense.paidBy === 'partner2' ? remainder : 0),
      partner2Owes: half + (expense.paidBy === 'partner1' ? remainder : 0),
    };
  }
  
  if (expense.splitType === 'percentage') {
    const partner1Amount = Math.round(expense.amount * (expense.partner1Share / 100));
    const partner2Amount = expense.amount - partner1Amount;
    return {
      partner1Owes: partner1Amount,
      partner2Owes: partner2Amount,
    };
  }
  
  // exact split
  return {
    partner1Owes: expense.partner1Share,
    partner2Owes: expense.partner2Share,
  };
}

/**
 * Calculate aggregates from expenses and settlements
 */
function calculateAggregates(expenses, settlements) {
  let partner1Paid = 0;
  let partner2Paid = 0;
  let partner1Owes = 0;
  let partner2Owes = 0;

  for (const expense of expenses) {
    const split = calculateExpenseSplit(expense);
    
    if (expense.paidBy === 'partner1') {
      partner1Paid += expense.amount;
      partner2Owes += split.partner2Owes;
    } else {
      partner2Paid += expense.amount;
      partner1Owes += split.partner1Owes;
    }
  }

  for (const settlement of settlements) {
    if (settlement.paidBy === 'partner1') {
      partner1Owes = Math.max(0, partner1Owes - settlement.amount);
    } else {
      partner2Owes = Math.max(0, partner2Owes - settlement.amount);
    }
  }

  const netBalance = partner2Owes - partner1Owes;

  return {
    expenseCount: expenses.length,
    settlementCount: settlements.length,
    partner1TotalPaid: partner1Paid,
    partner2TotalPaid: partner2Paid,
    partner1TotalOwes: partner1Owes,
    partner2TotalOwes: partner2Owes,
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
 * Update couple with aggregates
 */
async function updateCoupleAggregates(coupleId, aggregates) {
  await docClient.send(new UpdateCommand({
    TableName: CONFIG.coupleTableName,
    Key: { id: coupleId },
    UpdateExpression: `
      SET expenseCount = :expenseCount,
          settlementCount = :settlementCount,
          partner1TotalPaid = :partner1TotalPaid,
          partner2TotalPaid = :partner2TotalPaid,
          partner1TotalOwes = :partner1TotalOwes,
          partner2TotalOwes = :partner2TotalOwes,
          netBalance = :netBalance,
          lastCalculatedAt = :lastCalculatedAt
    `,
    ExpressionAttributeValues: {
      ':expenseCount': aggregates.expenseCount,
      ':settlementCount': aggregates.settlementCount,
      ':partner1TotalPaid': aggregates.partner1TotalPaid,
      ':partner2TotalPaid': aggregates.partner2TotalPaid,
      ':partner1TotalOwes': aggregates.partner1TotalOwes,
      ':partner2TotalOwes': aggregates.partner2TotalOwes,
      ':netBalance': aggregates.netBalance,
      ':lastCalculatedAt': aggregates.lastCalculatedAt,
    },
  }));
}

/**
 * Main backfill function
 */
async function backfillAllCouples() {
  console.log('='.repeat(60));
  console.log('Backfill Aggregates Script');
  console.log('='.repeat(60));
  console.log('Configuration:');
  console.log(`  Region: ${CONFIG.region}`);
  console.log(`  Couple Table: ${CONFIG.coupleTableName}`);
  console.log(`  Expense Table: ${CONFIG.expenseTableName}`);
  console.log(`  Settlement Table: ${CONFIG.settlementTableName}`);
  console.log('');

  try {
    console.log('Fetching all couples...');
    const couples = await getAllCouples();
    console.log(`Found ${couples.length} couple(s) to process\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < couples.length; i++) {
      const couple = couples[i];
      const coupleId = couple.id;
      const coupleName = couple.name || 'Unknown';

      console.log(`[${i + 1}/${couples.length}] Processing: ${coupleName} (${coupleId})`);

      try {
        const [expenses, settlements] = await Promise.all([
          getExpensesForCouple(coupleId),
          getSettlementsForCouple(coupleId),
        ]);

        console.log(`  Found ${expenses.length} expenses, ${settlements.length} settlements`);

        const aggregates = calculateAggregates(expenses, settlements);
        console.log(`  Aggregates: netBalance=${aggregates.netBalance}, p1Paid=${aggregates.partner1TotalPaid}, p2Paid=${aggregates.partner2TotalPaid}`);

        await updateCoupleAggregates(coupleId, aggregates);
        console.log('  ✓ Updated successfully\n');
        successCount++;
      } catch (error) {
        console.error(`  ✗ Error: ${error.message}\n`);
        errorCount++;
      }
    }

    console.log('='.repeat(60));
    console.log('Backfill Complete!');
    console.log(`  Success: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
backfillAllCouples();
