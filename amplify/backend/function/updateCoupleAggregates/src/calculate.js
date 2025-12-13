/**
 * Calculate what each partner owes for an expense
 * Ported from src/utils/helpers.ts
 */
export function calculateExpenseSplit(expense) {
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
 * Ported from src/utils/helpers.ts calculateBalance()
 */
export function calculateAggregates(expenses, settlements) {
  let partner1Paid = 0;
  let partner2Paid = 0;
  let partner1Owes = 0;
  let partner2Owes = 0;

  // Calculate from expenses
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

  // Apply settlements
  for (const settlement of settlements) {
    if (settlement.paidBy === 'partner1') {
      partner1Owes = Math.max(0, partner1Owes - settlement.amount);
    } else {
      partner2Owes = Math.max(0, partner2Owes - settlement.amount);
    }
  }

  // Net balance: positive means partner2 owes partner1
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
