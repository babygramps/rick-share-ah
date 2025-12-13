import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { calculateAggregates } from './calculate.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

function log(level, message, meta) {
  const payload = {
    level,
    message,
    ...(meta ? { meta } : {}),
    ts: new Date().toISOString(),
  };
  console.log(JSON.stringify(payload));
}

/**
 * Query all expenses for a couple
 */
async function queryAllExpenses(coupleId) {
  const tableName = process.env.API_RICKSHAREAH_EXPENSETABLE_NAME;
  if (!tableName) {
    throw new Error('Missing EXPENSE table environment variable');
  }

  const items = [];
  let lastEvaluatedKey = undefined;

  do {
    const result = await docClient.send(new QueryCommand({
      TableName: tableName,
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
async function queryAllSettlements(coupleId) {
  const tableName = process.env.API_RICKSHAREAH_SETTLEMENTTABLE_NAME;
  if (!tableName) {
    throw new Error('Missing SETTLEMENT table environment variable');
  }

  const items = [];
  let lastEvaluatedKey = undefined;

  do {
    const result = await docClient.send(new QueryCommand({
      TableName: tableName,
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
 * Update the couple record with new aggregates
 */
async function updateCoupleRecord(coupleId, aggregates) {
  const tableName = process.env.API_RICKSHAREAH_COUPLETABLE_NAME;
  if (!tableName) {
    throw new Error('Missing COUPLE table environment variable');
  }

  await docClient.send(new UpdateCommand({
    TableName: tableName,
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
 * Lambda handler for DynamoDB Stream events
 */
export const handler = async (event, context) => {
  const requestId = context?.awsRequestId;
  log('info', 'updateCoupleAggregates.start', {
    requestId,
    recordCount: event?.Records?.length || 0,
  });

  // Extract unique coupleIds from stream records
  const affectedCoupleIds = new Set();

  for (const record of event.Records || []) {
    // Handle both INSERT, MODIFY, and REMOVE events
    const newImage = record.dynamodb?.NewImage;
    const oldImage = record.dynamodb?.OldImage;
    
    // Extract coupleId from either new or old image (for deletes)
    const coupleId = newImage?.coupleId?.S || oldImage?.coupleId?.S;
    
    if (coupleId) {
      affectedCoupleIds.add(coupleId);
      log('debug', 'updateCoupleAggregates.foundCoupleId', {
        requestId,
        coupleId,
        eventName: record.eventName,
      });
    }
  }

  log('info', 'updateCoupleAggregates.affectedCouples', {
    requestId,
    count: affectedCoupleIds.size,
    coupleIds: Array.from(affectedCoupleIds),
  });

  // Recalculate and update each affected couple
  const results = [];
  for (const coupleId of affectedCoupleIds) {
    try {
      log('info', 'updateCoupleAggregates.processing', { requestId, coupleId });

      const [expenses, settlements] = await Promise.all([
        queryAllExpenses(coupleId),
        queryAllSettlements(coupleId),
      ]);

      log('info', 'updateCoupleAggregates.dataFetched', {
        requestId,
        coupleId,
        expenseCount: expenses.length,
        settlementCount: settlements.length,
      });

      const aggregates = calculateAggregates(expenses, settlements);

      await updateCoupleRecord(coupleId, aggregates);

      log('info', 'updateCoupleAggregates.updated', {
        requestId,
        coupleId,
        aggregates,
      });

      results.push({ coupleId, success: true, aggregates });
    } catch (error) {
      log('error', 'updateCoupleAggregates.error', {
        requestId,
        coupleId,
        errorName: error?.name,
        errorMessage: error?.message,
        stack: error?.stack,
      });
      results.push({ coupleId, success: false, error: error.message });
    }
  }

  log('info', 'updateCoupleAggregates.complete', {
    requestId,
    results,
  });

  return { statusCode: 200, body: JSON.stringify(results) };
};
