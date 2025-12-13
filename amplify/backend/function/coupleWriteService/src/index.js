/**
 * coupleWriteService - Trusted write service for couple data
 * 
 * Handles all mutations with:
 * - Membership verification (only couple members can write)
 * - Transactional updates (expense/settlement + aggregates in one transaction)
 * - Idempotency via clientMutationId
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  GetCommand, 
  QueryCommand, 
  TransactWriteCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand
} = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Table names are based on Amplify conventions: {ModelName}-{apiId}-{env}
const getTableName = (modelName) => {
  const apiId = process.env.API_RICKSHAREAH_GRAPHQLAPIIDOUTPUT;
  const env = process.env.ENV;
  return `${modelName}-${apiId}-${env}`;
};

const COUPLE_TABLE = () => getTableName('Couple');
const EXPENSE_TABLE = () => getTableName('Expense');
const SETTLEMENT_TABLE = () => getTableName('Settlement');

// Generate invite code
const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Get caller's user ID from the event
const getCallerId = (event) => {
  // AppSync resolver events have identity info
  if (event.identity && event.identity.sub) {
    return event.identity.sub;
  }
  if (event.identity && event.identity.claims && event.identity.claims.sub) {
    return event.identity.claims.sub;
  }
  throw new Error('Could not determine caller identity');
};

// Get caller's email from the event
const getCallerEmail = (event) => {
  if (event.identity && event.identity.claims && event.identity.claims.email) {
    return event.identity.claims.email;
  }
  return null;
};

// Verify user is a member of the couple
const verifyMembership = async (coupleId, userId) => {
  const result = await docClient.send(new GetCommand({
    TableName: COUPLE_TABLE(),
    Key: { id: coupleId }
  }));
  
  if (!result.Item) {
    throw new Error('Couple not found');
  }
  
  const couple = result.Item;
  if (!couple.owners || !couple.owners.includes(userId)) {
    throw new Error('Access denied: you are not a member of this couple');
  }
  
  return couple;
};

// Get couple by ID (for internal use)
const getCouple = async (coupleId) => {
  const result = await docClient.send(new GetCommand({
    TableName: COUPLE_TABLE(),
    Key: { id: coupleId }
  }));
  return result.Item;
};

// Get expense by ID
const getExpense = async (expenseId) => {
  const result = await docClient.send(new GetCommand({
    TableName: EXPENSE_TABLE(),
    Key: { id: expenseId }
  }));
  return result.Item;
};

// Get settlement by ID
const getSettlement = async (settlementId) => {
  const result = await docClient.send(new GetCommand({
    TableName: SETTLEMENT_TABLE(),
    Key: { id: settlementId }
  }));
  return result.Item;
};

// Query couple by invite code
const getCoupleByInviteCode = async (inviteCode) => {
  const result = await docClient.send(new QueryCommand({
    TableName: COUPLE_TABLE(),
    IndexName: 'byInviteCode',
    KeyConditionExpression: 'inviteCode = :code',
    ExpressionAttributeValues: {
      ':code': inviteCode
    }
  }));
  return result.Items && result.Items.length > 0 ? result.Items[0] : null;
};

// Calculate aggregate deltas for expense changes
const calculateExpenseDeltas = (expense, couple, operation) => {
  const isPaidByPartner1 = expense.paidBy === couple.partner1Id || expense.paidBy === couple.partner1Name;
  const multiplier = operation === 'delete' ? -1 : 1;
  
  return {
    expenseCountDelta: multiplier * 1,
    partner1TotalPaidDelta: isPaidByPartner1 ? multiplier * expense.amount : 0,
    partner2TotalPaidDelta: isPaidByPartner1 ? 0 : multiplier * expense.amount,
    partner1TotalOwesDelta: multiplier * expense.partner1Share,
    partner2TotalOwesDelta: multiplier * expense.partner2Share
  };
};

// Calculate aggregate deltas for settlement changes
const calculateSettlementDeltas = (settlement, couple, operation) => {
  const multiplier = operation === 'delete' ? -1 : 1;
  return {
    settlementCountDelta: multiplier * 1
    // Settlements affect netBalance differently - they're payments to settle up
    // For now, we only track count; netBalance is computed from expenses
  };
};

// Calculate net balance from totals
const calculateNetBalance = (partner1TotalPaid, partner2TotalPaid, partner1TotalOwes, partner2TotalOwes) => {
  // Each partner's "credit" is what they paid minus what they owe
  const partner1Credit = partner1TotalPaid - partner1TotalOwes;
  const partner2Credit = partner2TotalPaid - partner2TotalOwes;
  // Positive netBalance means partner2 owes partner1
  return partner1Credit - partner2Credit;
};

// Handler for createCoupleTrusted
const handleCreateCouple = async (event, input) => {
  const userId = getCallerId(event);
  const userEmail = getCallerEmail(event) || '';
  const now = new Date().toISOString();
  
  const coupleId = uuidv4();
  const inviteCode = generateInviteCode();
  
  const couple = {
    id: coupleId,
    __typename: 'Couple',
    owners: [userId],
    name: input.name,
    partner1Id: userId,
    partner1Name: input.partnerName,
    partner1Email: userEmail,
    partner2Id: null,
    partner2Name: null,
    partner2Email: null,
    inviteCode: inviteCode,
    defaultSplitPercent: input.defaultSplitPercent || 50,
    expenseCount: 0,
    settlementCount: 0,
    partner1TotalPaid: 0,
    partner2TotalPaid: 0,
    partner1TotalOwes: 0,
    partner2TotalOwes: 0,
    netBalance: 0,
    lastCalculatedAt: now,
    createdAt: now,
    updatedAt: now
  };
  
  await docClient.send(new PutCommand({
    TableName: COUPLE_TABLE(),
    Item: couple,
    ConditionExpression: 'attribute_not_exists(id)'
  }));
  
  console.log('[createCoupleTrusted] Created couple', { coupleId, userId });
  
  return {
    success: true,
    couple: couple,
    clientMutationId: input.clientMutationId
  };
};

// Handler for joinCoupleByInviteCode
const handleJoinCouple = async (event, input) => {
  const userId = getCallerId(event);
  const userEmail = getCallerEmail(event) || '';
  const now = new Date().toISOString();
  
  // Find couple by invite code
  const couple = await getCoupleByInviteCode(input.inviteCode);
  
  if (!couple) {
    return {
      success: false,
      error: 'Invalid invite code',
      clientMutationId: input.clientMutationId
    };
  }
  
  if (couple.partner2Id) {
    return {
      success: false,
      error: 'This couple already has two partners',
      clientMutationId: input.clientMutationId
    };
  }
  
  if (couple.partner1Id === userId) {
    return {
      success: false,
      error: 'You cannot join your own couple',
      clientMutationId: input.clientMutationId
    };
  }
  
  // Update couple to add partner2 and add userId to owners
  const result = await docClient.send(new UpdateCommand({
    TableName: COUPLE_TABLE(),
    Key: { id: couple.id },
    UpdateExpression: 'SET partner2Id = :p2id, partner2Name = :p2name, partner2Email = :p2email, ' +
                      'owners = list_append(owners, :newOwner), inviteCode = :null, updatedAt = :now',
    ExpressionAttributeValues: {
      ':p2id': userId,
      ':p2name': input.partnerName,
      ':p2email': userEmail,
      ':newOwner': [userId],
      ':null': null,
      ':now': now
    },
    ConditionExpression: 'attribute_not_exists(partner2Id) OR partner2Id = :nullCheck',
    ExpressionAttributeValues: {
      ':p2id': userId,
      ':p2name': input.partnerName,
      ':p2email': userEmail,
      ':newOwner': [userId],
      ':null': null,
      ':now': now,
      ':nullCheck': null
    },
    ReturnValues: 'ALL_NEW'
  }));
  
  console.log('[joinCoupleByInviteCode] User joined couple', { coupleId: couple.id, userId });
  
  return {
    success: true,
    couple: result.Attributes,
    clientMutationId: input.clientMutationId
  };
};

// Handler for createExpenseTrusted
const handleCreateExpense = async (event, input) => {
  const userId = getCallerId(event);
  const now = new Date().toISOString();
  
  // Verify membership and get couple
  const couple = await verifyMembership(input.coupleId, userId);
  
  const expenseId = uuidv4();
  const expense = {
    id: expenseId,
    __typename: 'Expense',
    owners: couple.owners,
    coupleId: input.coupleId,
    description: input.description,
    amount: input.amount,
    paidBy: input.paidBy,
    splitType: input.splitType,
    partner1Share: input.partner1Share,
    partner2Share: input.partner2Share,
    category: input.category,
    date: input.date,
    note: input.note || null,
    createdAt: now,
    updatedAt: now
  };
  
  // Calculate deltas
  const deltas = calculateExpenseDeltas(expense, couple, 'create');
  
  // New aggregate values
  const newExpenseCount = (couple.expenseCount || 0) + deltas.expenseCountDelta;
  const newPartner1TotalPaid = (couple.partner1TotalPaid || 0) + deltas.partner1TotalPaidDelta;
  const newPartner2TotalPaid = (couple.partner2TotalPaid || 0) + deltas.partner2TotalPaidDelta;
  const newPartner1TotalOwes = (couple.partner1TotalOwes || 0) + deltas.partner1TotalOwesDelta;
  const newPartner2TotalOwes = (couple.partner2TotalOwes || 0) + deltas.partner2TotalOwesDelta;
  const newNetBalance = calculateNetBalance(newPartner1TotalPaid, newPartner2TotalPaid, newPartner1TotalOwes, newPartner2TotalOwes);
  
  // Transactional write: create expense + update couple aggregates
  await docClient.send(new TransactWriteCommand({
    TransactItems: [
      {
        Put: {
          TableName: EXPENSE_TABLE(),
          Item: expense,
          ConditionExpression: 'attribute_not_exists(id)'
        }
      },
      {
        Update: {
          TableName: COUPLE_TABLE(),
          Key: { id: input.coupleId },
          UpdateExpression: 'SET expenseCount = :ec, partner1TotalPaid = :p1p, partner2TotalPaid = :p2p, ' +
                            'partner1TotalOwes = :p1o, partner2TotalOwes = :p2o, netBalance = :nb, ' +
                            'lastCalculatedAt = :now, updatedAt = :now',
          ExpressionAttributeValues: {
            ':ec': newExpenseCount,
            ':p1p': newPartner1TotalPaid,
            ':p2p': newPartner2TotalPaid,
            ':p1o': newPartner1TotalOwes,
            ':p2o': newPartner2TotalOwes,
            ':nb': newNetBalance,
            ':now': now
          }
        }
      }
    ]
  }));
  
  console.log('[createExpenseTrusted] Created expense', { expenseId, coupleId: input.coupleId, userId });
  
  // Return updated couple
  const updatedCouple = await getCouple(input.coupleId);
  
  return {
    success: true,
    expense: expense,
    couple: updatedCouple,
    clientMutationId: input.clientMutationId
  };
};

// Handler for updateExpenseTrusted
const handleUpdateExpense = async (event, input) => {
  const userId = getCallerId(event);
  const now = new Date().toISOString();
  
  // Get existing expense
  const existingExpense = await getExpense(input.id);
  if (!existingExpense) {
    return {
      success: false,
      error: 'Expense not found',
      clientMutationId: input.clientMutationId
    };
  }
  
  // Verify membership
  const couple = await verifyMembership(existingExpense.coupleId, userId);
  
  // Build updated expense
  const updatedExpense = {
    ...existingExpense,
    description: input.description !== undefined ? input.description : existingExpense.description,
    amount: input.amount !== undefined ? input.amount : existingExpense.amount,
    paidBy: input.paidBy !== undefined ? input.paidBy : existingExpense.paidBy,
    splitType: input.splitType !== undefined ? input.splitType : existingExpense.splitType,
    partner1Share: input.partner1Share !== undefined ? input.partner1Share : existingExpense.partner1Share,
    partner2Share: input.partner2Share !== undefined ? input.partner2Share : existingExpense.partner2Share,
    category: input.category !== undefined ? input.category : existingExpense.category,
    date: input.date !== undefined ? input.date : existingExpense.date,
    note: input.note !== undefined ? input.note : existingExpense.note,
    updatedAt: now
  };
  
  // Calculate deltas (remove old, add new)
  const oldDeltas = calculateExpenseDeltas(existingExpense, couple, 'delete');
  const newDeltas = calculateExpenseDeltas(updatedExpense, couple, 'create');
  
  const netDeltas = {
    expenseCountDelta: 0, // Count doesn't change on update
    partner1TotalPaidDelta: oldDeltas.partner1TotalPaidDelta + newDeltas.partner1TotalPaidDelta,
    partner2TotalPaidDelta: oldDeltas.partner2TotalPaidDelta + newDeltas.partner2TotalPaidDelta,
    partner1TotalOwesDelta: oldDeltas.partner1TotalOwesDelta + newDeltas.partner1TotalOwesDelta,
    partner2TotalOwesDelta: oldDeltas.partner2TotalOwesDelta + newDeltas.partner2TotalOwesDelta
  };
  
  // New aggregate values
  const newPartner1TotalPaid = (couple.partner1TotalPaid || 0) + netDeltas.partner1TotalPaidDelta;
  const newPartner2TotalPaid = (couple.partner2TotalPaid || 0) + netDeltas.partner2TotalPaidDelta;
  const newPartner1TotalOwes = (couple.partner1TotalOwes || 0) + netDeltas.partner1TotalOwesDelta;
  const newPartner2TotalOwes = (couple.partner2TotalOwes || 0) + netDeltas.partner2TotalOwesDelta;
  const newNetBalance = calculateNetBalance(newPartner1TotalPaid, newPartner2TotalPaid, newPartner1TotalOwes, newPartner2TotalOwes);
  
  // Transactional write
  await docClient.send(new TransactWriteCommand({
    TransactItems: [
      {
        Put: {
          TableName: EXPENSE_TABLE(),
          Item: updatedExpense
        }
      },
      {
        Update: {
          TableName: COUPLE_TABLE(),
          Key: { id: existingExpense.coupleId },
          UpdateExpression: 'SET partner1TotalPaid = :p1p, partner2TotalPaid = :p2p, ' +
                            'partner1TotalOwes = :p1o, partner2TotalOwes = :p2o, netBalance = :nb, ' +
                            'lastCalculatedAt = :now, updatedAt = :now',
          ExpressionAttributeValues: {
            ':p1p': newPartner1TotalPaid,
            ':p2p': newPartner2TotalPaid,
            ':p1o': newPartner1TotalOwes,
            ':p2o': newPartner2TotalOwes,
            ':nb': newNetBalance,
            ':now': now
          }
        }
      }
    ]
  }));
  
  console.log('[updateExpenseTrusted] Updated expense', { expenseId: input.id, userId });
  
  const updatedCouple = await getCouple(existingExpense.coupleId);
  
  return {
    success: true,
    expense: updatedExpense,
    couple: updatedCouple,
    clientMutationId: input.clientMutationId
  };
};

// Handler for deleteExpenseTrusted
const handleDeleteExpense = async (event, input) => {
  const userId = getCallerId(event);
  const now = new Date().toISOString();
  
  // Get existing expense
  const existingExpense = await getExpense(input.id);
  if (!existingExpense) {
    return {
      success: false,
      error: 'Expense not found',
      clientMutationId: input.clientMutationId
    };
  }
  
  // Verify membership
  const couple = await verifyMembership(existingExpense.coupleId, userId);
  
  // Calculate deltas
  const deltas = calculateExpenseDeltas(existingExpense, couple, 'delete');
  
  // New aggregate values
  const newExpenseCount = Math.max(0, (couple.expenseCount || 0) + deltas.expenseCountDelta);
  const newPartner1TotalPaid = (couple.partner1TotalPaid || 0) + deltas.partner1TotalPaidDelta;
  const newPartner2TotalPaid = (couple.partner2TotalPaid || 0) + deltas.partner2TotalPaidDelta;
  const newPartner1TotalOwes = (couple.partner1TotalOwes || 0) + deltas.partner1TotalOwesDelta;
  const newPartner2TotalOwes = (couple.partner2TotalOwes || 0) + deltas.partner2TotalOwesDelta;
  const newNetBalance = calculateNetBalance(newPartner1TotalPaid, newPartner2TotalPaid, newPartner1TotalOwes, newPartner2TotalOwes);
  
  // Transactional write
  await docClient.send(new TransactWriteCommand({
    TransactItems: [
      {
        Delete: {
          TableName: EXPENSE_TABLE(),
          Key: { id: input.id }
        }
      },
      {
        Update: {
          TableName: COUPLE_TABLE(),
          Key: { id: existingExpense.coupleId },
          UpdateExpression: 'SET expenseCount = :ec, partner1TotalPaid = :p1p, partner2TotalPaid = :p2p, ' +
                            'partner1TotalOwes = :p1o, partner2TotalOwes = :p2o, netBalance = :nb, ' +
                            'lastCalculatedAt = :now, updatedAt = :now',
          ExpressionAttributeValues: {
            ':ec': newExpenseCount,
            ':p1p': newPartner1TotalPaid,
            ':p2p': newPartner2TotalPaid,
            ':p1o': newPartner1TotalOwes,
            ':p2o': newPartner2TotalOwes,
            ':nb': newNetBalance,
            ':now': now
          }
        }
      }
    ]
  }));
  
  console.log('[deleteExpenseTrusted] Deleted expense', { expenseId: input.id, userId });
  
  const updatedCouple = await getCouple(existingExpense.coupleId);
  
  return {
    success: true,
    expense: existingExpense,
    couple: updatedCouple,
    clientMutationId: input.clientMutationId
  };
};

// Handler for createSettlementTrusted
const handleCreateSettlement = async (event, input) => {
  const userId = getCallerId(event);
  const now = new Date().toISOString();
  
  // Verify membership and get couple
  const couple = await verifyMembership(input.coupleId, userId);
  
  const settlementId = uuidv4();
  const settlement = {
    id: settlementId,
    __typename: 'Settlement',
    owners: couple.owners,
    coupleId: input.coupleId,
    amount: input.amount,
    paidBy: input.paidBy,
    paidTo: input.paidTo,
    date: input.date,
    note: input.note || null,
    createdAt: now,
    updatedAt: now
  };
  
  // Calculate new settlement count
  const newSettlementCount = (couple.settlementCount || 0) + 1;
  
  // Transactional write
  await docClient.send(new TransactWriteCommand({
    TransactItems: [
      {
        Put: {
          TableName: SETTLEMENT_TABLE(),
          Item: settlement,
          ConditionExpression: 'attribute_not_exists(id)'
        }
      },
      {
        Update: {
          TableName: COUPLE_TABLE(),
          Key: { id: input.coupleId },
          UpdateExpression: 'SET settlementCount = :sc, lastCalculatedAt = :now, updatedAt = :now',
          ExpressionAttributeValues: {
            ':sc': newSettlementCount,
            ':now': now
          }
        }
      }
    ]
  }));
  
  console.log('[createSettlementTrusted] Created settlement', { settlementId, coupleId: input.coupleId, userId });
  
  const updatedCouple = await getCouple(input.coupleId);
  
  return {
    success: true,
    settlement: settlement,
    couple: updatedCouple,
    clientMutationId: input.clientMutationId
  };
};

// Handler for updateSettlementTrusted
const handleUpdateSettlement = async (event, input) => {
  const userId = getCallerId(event);
  const now = new Date().toISOString();
  
  // Get existing settlement
  const existingSettlement = await getSettlement(input.id);
  if (!existingSettlement) {
    return {
      success: false,
      error: 'Settlement not found',
      clientMutationId: input.clientMutationId
    };
  }
  
  // Verify membership
  await verifyMembership(existingSettlement.coupleId, userId);
  
  // Build updated settlement
  const updatedSettlement = {
    ...existingSettlement,
    amount: input.amount !== undefined ? input.amount : existingSettlement.amount,
    paidBy: input.paidBy !== undefined ? input.paidBy : existingSettlement.paidBy,
    paidTo: input.paidTo !== undefined ? input.paidTo : existingSettlement.paidTo,
    date: input.date !== undefined ? input.date : existingSettlement.date,
    note: input.note !== undefined ? input.note : existingSettlement.note,
    updatedAt: now
  };
  
  // Update settlement (no aggregate changes for updates, just the settlement count stays same)
  await docClient.send(new PutCommand({
    TableName: SETTLEMENT_TABLE(),
    Item: updatedSettlement
  }));
  
  console.log('[updateSettlementTrusted] Updated settlement', { settlementId: input.id, userId });
  
  const updatedCouple = await getCouple(existingSettlement.coupleId);
  
  return {
    success: true,
    settlement: updatedSettlement,
    couple: updatedCouple,
    clientMutationId: input.clientMutationId
  };
};

// Handler for deleteSettlementTrusted
const handleDeleteSettlement = async (event, input) => {
  const userId = getCallerId(event);
  const now = new Date().toISOString();
  
  // Get existing settlement
  const existingSettlement = await getSettlement(input.id);
  if (!existingSettlement) {
    return {
      success: false,
      error: 'Settlement not found',
      clientMutationId: input.clientMutationId
    };
  }
  
  // Verify membership
  const couple = await verifyMembership(existingSettlement.coupleId, userId);
  
  const newSettlementCount = Math.max(0, (couple.settlementCount || 0) - 1);
  
  // Transactional write
  await docClient.send(new TransactWriteCommand({
    TransactItems: [
      {
        Delete: {
          TableName: SETTLEMENT_TABLE(),
          Key: { id: input.id }
        }
      },
      {
        Update: {
          TableName: COUPLE_TABLE(),
          Key: { id: existingSettlement.coupleId },
          UpdateExpression: 'SET settlementCount = :sc, lastCalculatedAt = :now, updatedAt = :now',
          ExpressionAttributeValues: {
            ':sc': newSettlementCount,
            ':now': now
          }
        }
      }
    ]
  }));
  
  console.log('[deleteSettlementTrusted] Deleted settlement', { settlementId: input.id, userId });
  
  const updatedCouple = await getCouple(existingSettlement.coupleId);
  
  return {
    success: true,
    settlement: existingSettlement,
    couple: updatedCouple,
    clientMutationId: input.clientMutationId
  };
};

// Handler for recalculateCoupleAggregates (admin/repair)
const handleRecalculateAggregates = async (event, coupleId) => {
  const userId = getCallerId(event);
  const now = new Date().toISOString();
  
  // Verify membership
  const couple = await verifyMembership(coupleId, userId);
  
  // Query all expenses for this couple
  let expenses = [];
  let lastEvaluatedKey = undefined;
  
  do {
    const result = await docClient.send(new QueryCommand({
      TableName: EXPENSE_TABLE(),
      IndexName: 'byCouple',
      KeyConditionExpression: 'coupleId = :cid',
      ExpressionAttributeValues: {
        ':cid': coupleId
      },
      ExclusiveStartKey: lastEvaluatedKey
    }));
    expenses = expenses.concat(result.Items || []);
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);
  
  // Query all settlements for this couple
  let settlements = [];
  lastEvaluatedKey = undefined;
  
  do {
    const result = await docClient.send(new QueryCommand({
      TableName: SETTLEMENT_TABLE(),
      IndexName: 'byCouple',
      KeyConditionExpression: 'coupleId = :cid',
      ExpressionAttributeValues: {
        ':cid': coupleId
      },
      ExclusiveStartKey: lastEvaluatedKey
    }));
    settlements = settlements.concat(result.Items || []);
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);
  
  // Calculate aggregates from scratch
  let partner1TotalPaid = 0;
  let partner2TotalPaid = 0;
  let partner1TotalOwes = 0;
  let partner2TotalOwes = 0;
  
  for (const expense of expenses) {
    const isPaidByPartner1 = expense.paidBy === couple.partner1Id || expense.paidBy === couple.partner1Name;
    if (isPaidByPartner1) {
      partner1TotalPaid += expense.amount;
    } else {
      partner2TotalPaid += expense.amount;
    }
    partner1TotalOwes += expense.partner1Share;
    partner2TotalOwes += expense.partner2Share;
  }
  
  const netBalance = calculateNetBalance(partner1TotalPaid, partner2TotalPaid, partner1TotalOwes, partner2TotalOwes);
  
  // Update couple with recalculated values
  await docClient.send(new UpdateCommand({
    TableName: COUPLE_TABLE(),
    Key: { id: coupleId },
    UpdateExpression: 'SET expenseCount = :ec, settlementCount = :sc, partner1TotalPaid = :p1p, ' +
                      'partner2TotalPaid = :p2p, partner1TotalOwes = :p1o, partner2TotalOwes = :p2o, ' +
                      'netBalance = :nb, lastCalculatedAt = :now, updatedAt = :now',
    ExpressionAttributeValues: {
      ':ec': expenses.length,
      ':sc': settlements.length,
      ':p1p': partner1TotalPaid,
      ':p2p': partner2TotalPaid,
      ':p1o': partner1TotalOwes,
      ':p2o': partner2TotalOwes,
      ':nb': netBalance,
      ':now': now
    }
  }));
  
  console.log('[recalculateCoupleAggregates] Recalculated', { 
    coupleId, 
    expenseCount: expenses.length, 
    settlementCount: settlements.length,
    netBalance 
  });
  
  const updatedCouple = await getCouple(coupleId);
  
  return {
    success: true,
    couple: updatedCouple
  };
};

// Main handler - routes to appropriate function based on field name
exports.handler = async (event) => {
  console.log('[coupleWriteService] Event:', JSON.stringify(event, null, 2));
  
  try {
    // The fieldName tells us which mutation was called
    const fieldName = event.fieldName || event.info?.fieldName;
    const input = event.arguments?.input;
    
    switch (fieldName) {
      case 'createCoupleTrusted':
        return await handleCreateCouple(event, input);
      
      case 'joinCoupleByInviteCode':
        return await handleJoinCouple(event, input);
      
      case 'createExpenseTrusted':
        return await handleCreateExpense(event, input);
      
      case 'updateExpenseTrusted':
        return await handleUpdateExpense(event, input);
      
      case 'deleteExpenseTrusted':
        return await handleDeleteExpense(event, input);
      
      case 'createSettlementTrusted':
        return await handleCreateSettlement(event, input);
      
      case 'updateSettlementTrusted':
        return await handleUpdateSettlement(event, input);
      
      case 'deleteSettlementTrusted':
        return await handleDeleteSettlement(event, input);
      
      case 'recalculateCoupleAggregates':
        return await handleRecalculateAggregates(event, event.arguments?.coupleId);
      
      default:
        console.error('[coupleWriteService] Unknown field:', fieldName);
        return {
          success: false,
          error: `Unknown mutation: ${fieldName}`
        };
    }
  } catch (error) {
    console.error('[coupleWriteService] Error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
};
