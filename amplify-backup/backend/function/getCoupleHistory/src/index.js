import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

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
 * Query all expenses for a couple (with optional filters)
 */
async function queryExpenses(coupleId, categoryFilter, paidByFilter) {
  const tableName = process.env.API_RICKSHAREAH_EXPENSETABLE_NAME;
  if (!tableName) {
    throw new Error('Missing EXPENSE table environment variable');
  }

  const items = [];
  let lastEvaluatedKey = undefined;

  // Build filter expression
  let filterExpression = '';
  const expressionAttributeValues = { ':coupleId': coupleId };
  const expressionAttributeNames = {};

  if (categoryFilter && categoryFilter !== 'all') {
    filterExpression += 'category = :category';
    expressionAttributeValues[':category'] = categoryFilter;
  }

  if (paidByFilter && paidByFilter !== 'all') {
    if (filterExpression) filterExpression += ' AND ';
    filterExpression += 'paidBy = :paidBy';
    expressionAttributeValues[':paidBy'] = paidByFilter;
  }

  do {
    const queryParams = {
      TableName: tableName,
      IndexName: 'byCouple',
      KeyConditionExpression: 'coupleId = :coupleId',
      ExpressionAttributeValues: expressionAttributeValues,
      ExclusiveStartKey: lastEvaluatedKey,
    };

    if (filterExpression) {
      queryParams.FilterExpression = filterExpression;
    }

    if (Object.keys(expressionAttributeNames).length > 0) {
      queryParams.ExpressionAttributeNames = expressionAttributeNames;
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    if (result.Items) {
      items.push(...result.Items);
    }
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

/**
 * Query all settlements for a couple (with optional filters)
 */
async function querySettlements(coupleId, paidByFilter) {
  const tableName = process.env.API_RICKSHAREAH_SETTLEMENTTABLE_NAME;
  if (!tableName) {
    throw new Error('Missing SETTLEMENT table environment variable');
  }

  const items = [];
  let lastEvaluatedKey = undefined;

  // Build filter expression
  let filterExpression = '';
  const expressionAttributeValues = { ':coupleId': coupleId };

  if (paidByFilter && paidByFilter !== 'all') {
    filterExpression = 'paidBy = :paidBy';
    expressionAttributeValues[':paidBy'] = paidByFilter;
  }

  do {
    const queryParams = {
      TableName: tableName,
      IndexName: 'byCouple',
      KeyConditionExpression: 'coupleId = :coupleId',
      ExpressionAttributeValues: expressionAttributeValues,
      ExclusiveStartKey: lastEvaluatedKey,
    };

    if (filterExpression) {
      queryParams.FilterExpression = filterExpression;
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    if (result.Items) {
      items.push(...result.Items);
    }
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

/**
 * Transform expense to HistoryItem format
 */
function expenseToHistoryItem(expense) {
  return {
    id: expense.id,
    type: 'expense',
    date: expense.date,
    createdAt: expense.createdAt,
    amount: expense.amount,
    paidBy: expense.paidBy,
    description: expense.description,
    category: expense.category,
    splitType: expense.splitType,
    partner1Share: expense.partner1Share,
    partner2Share: expense.partner2Share,
    paidTo: null,
    note: expense.note || null,
  };
}

/**
 * Transform settlement to HistoryItem format
 */
function settlementToHistoryItem(settlement) {
  return {
    id: settlement.id,
    type: 'settlement',
    date: settlement.date,
    createdAt: settlement.createdAt,
    amount: settlement.amount,
    paidBy: settlement.paidBy,
    description: null,
    category: null,
    splitType: null,
    partner1Share: null,
    partner2Share: null,
    paidTo: settlement.paidTo,
    note: settlement.note || null,
  };
}

/**
 * Parse cursor token
 */
function parseCursor(nextToken) {
  if (!nextToken) return null;
  try {
    return JSON.parse(Buffer.from(nextToken, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Create cursor token
 */
function createCursor(item) {
  if (!item) return null;
  const cursor = {
    date: item.date,
    createdAt: item.createdAt,
    id: item.id,
  };
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

/**
 * Lambda handler for getCoupleHistory query
 */
export const handler = async (event, context) => {
  const requestId = context?.awsRequestId;
  const args = event?.arguments || {};
  
  const {
    coupleId,
    limit = 20,
    nextToken,
    typeFilter,
    categoryFilter,
    paidByFilter,
  } = args;

  log('info', 'getCoupleHistory.start', {
    requestId,
    coupleId,
    limit,
    hasNextToken: !!nextToken,
    typeFilter,
    categoryFilter,
    paidByFilter,
  });

  if (!coupleId) {
    log('warn', 'getCoupleHistory.missingCoupleId', { requestId });
    return {
      items: [],
      nextToken: null,
      totalCount: 0,
    };
  }

  try {
    // Query both tables (unless filtered to one type)
    let expenses = [];
    let settlements = [];

    if (!typeFilter || typeFilter === 'expense' || typeFilter === 'all') {
      expenses = await queryExpenses(coupleId, categoryFilter, paidByFilter);
    }

    if (!typeFilter || typeFilter === 'settlement' || typeFilter === 'all') {
      // Category filter doesn't apply to settlements
      if (!categoryFilter || categoryFilter === 'all') {
        settlements = await querySettlements(coupleId, paidByFilter);
      }
    }

    log('info', 'getCoupleHistory.dataFetched', {
      requestId,
      expenseCount: expenses.length,
      settlementCount: settlements.length,
    });

    // Transform to HistoryItem format
    const allItems = [
      ...expenses.map(expenseToHistoryItem),
      ...settlements.map(settlementToHistoryItem),
    ];

    // Sort by date DESC, then createdAt DESC
    allItems.sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      
      const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bCreatedAt - aCreatedAt;
    });

    const totalCount = allItems.length;

    // Apply cursor-based pagination
    let startIndex = 0;
    const cursor = parseCursor(nextToken);
    
    if (cursor) {
      // Find the item after the cursor
      startIndex = allItems.findIndex(item => {
        // Find first item that comes after the cursor position
        const dateCompare = new Date(item.date).getTime() - new Date(cursor.date).getTime();
        if (dateCompare < 0) return true; // Item is older than cursor
        if (dateCompare === 0) {
          const itemCreatedAt = item.createdAt ? new Date(item.createdAt).getTime() : 0;
          const cursorCreatedAt = cursor.createdAt ? new Date(cursor.createdAt).getTime() : 0;
          if (itemCreatedAt < cursorCreatedAt) return true;
          if (itemCreatedAt === cursorCreatedAt && item.id !== cursor.id) {
            return allItems.findIndex(i => i.id === cursor.id) < allItems.findIndex(i => i.id === item.id);
          }
        }
        return false;
      });
      
      if (startIndex === -1) {
        startIndex = allItems.length; // Cursor points past end
      }
    }

    // Get page of items
    const pageItems = allItems.slice(startIndex, startIndex + limit);
    
    // Create next cursor if there are more items
    const hasMore = startIndex + limit < allItems.length;
    const newNextToken = hasMore ? createCursor(pageItems[pageItems.length - 1]) : null;

    log('info', 'getCoupleHistory.complete', {
      requestId,
      totalCount,
      pageSize: pageItems.length,
      hasMore,
    });

    return {
      items: pageItems,
      nextToken: newNextToken,
      totalCount,
    };
  } catch (error) {
    log('error', 'getCoupleHistory.error', {
      requestId,
      coupleId,
      errorName: error?.name,
      errorMessage: error?.message,
      stack: error?.stack,
    });

    return {
      items: [],
      nextToken: null,
      totalCount: 0,
    };
  }
};
