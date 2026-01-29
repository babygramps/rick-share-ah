import type { Expense, Settlement, Balance, PaymentSuggestion } from '../types';
import { CATEGORIES } from '../types';

/**
 * Format cents to currency string
 */
export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * Parse currency input string to cents
 */
export function parseCurrencyInput(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, '');
  const dollars = parseFloat(cleaned) || 0;
  return Math.round(dollars * 100);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Format date for input field
 */
export function formatDateForInput(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date as ISO string
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Parse Expense Shares JSON safely
 * Handles double-encoded JSON from AWSJSON GraphQL field
 */
export function parseExpenseShares(expense: Expense): Record<string, number> {
  if (expense.shares) {
    try {
      let shares = expense.shares;

      // Handle string input
      if (typeof shares === 'string') {
        let parsed = JSON.parse(shares);

        // Check for double-encoding: if the first parse gives us a string, parse again
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }

        return parsed;
      }

      return shares as unknown as Record<string, number>;
    } catch (e) {
      console.error('Failed to parse shares', e);
    }
  }

  // Fallback to legacy/couple logic if no shares map
  // We assume partner1Id and partner2Id are known in context, but here we might just have to rely on legacy fields if they exist
  // actually, without knowing precise userIds this is hard, but usually we just need this for calculation.

  // For calculation, if it's a legacy couple expense, we might format it into a map if we knew the IDs.
  // But often `calculateBalance` iterates expenses and needs to know who owes what.
  return {};
}

/**
 * Calculate the running balance for a Group using Simplified Debts
 */
export function calculateGroupBalance(
  expenses: Expense[],
  settlements: Settlement[],
  members: { userId: string }[],
  currentUserId: string
): Balance {
  const balances: Record<string, number> = {};

  // Initialize 0
  members.forEach(m => balances[m.userId] = 0);

  // 1. Sum up Expenses
  for (const expense of expenses) {
    const paidBy = expense.paidBy;
    const shares = parseExpenseShares(expense);
    const amount = expense.amount;

    // Legacy fallback check (if shares are empty but it's a couple expense)
    if (Object.keys(shares).length === 0 && (expense.partner1Share !== undefined || expense.partner2Share !== undefined)) {
      // This is tricky without knowing which ID maps to partner1/2. 
      // We will assume this is handled by the new schema migration or that we only use this for new groups.
      // For now, let's just create a basic map if we can't find shares.
      continue; // Skip legacy for now or implement if needed
    }

    // Add credit to payer
    balances[paidBy] = (balances[paidBy] || 0) + amount;

    // Subtract shares from debtors
    for (const [userId, shareAmount] of Object.entries(shares)) {
      balances[userId] = (balances[userId] || 0) - shareAmount;
    }
  }

  // 2. Apply Settlements
  for (const settlement of settlements) {
    // Payer gives money (Credit reduces? No, Debt reduces. Or Credit Increases?)
    // Wait. If A pays B $10.
    // A's net balance increases (they paid, so they are "owed" more or "owe" less).
    // B's net balance decreases (they received, so they are "owed" less or "owe" more).

    // Logic: Net Balance = Total Paid - Total Consumed.
    // Settlement is a transfer.
    // Payer sent money. So they "Paid" +Amount. 
    // Receiver got money. They "Paid" -Amount (or Consumed +Amount).

    balances[settlement.paidBy] = (balances[settlement.paidBy] || 0) + settlement.amount;
    balances[settlement.paidTo] = (balances[settlement.paidTo] || 0) - settlement.amount;
  }

  // 3. Simplified Debt Algorithm
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  Object.entries(balances).forEach(([id, amount]) => {
    // Round to avoid float errors
    const rounded = Math.round(amount);
    if (rounded < -1) debtors.push({ id, amount: rounded }); // negative = owes money
    if (rounded > 1) creditors.push({ id, amount: rounded }); // positive = is owed money
  });

  debtors.sort((a, b) => a.amount - b.amount); // Ascending (most negative first)
  creditors.sort((a, b) => b.amount - a.amount); // Descending (most positive first)

  const suggestedPayments: PaymentSuggestion[] = [];

  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    // The amount to settle is the min of what's owed vs what's accessible
    // debtor.amount is negative, so use Math.abs
    const amountData = Math.min(Math.abs(debtor.amount), creditor.amount);

    if (amountData > 0) {
      suggestedPayments.push({
        fromUserId: debtor.id,
        toUserId: creditor.id,
        amount: amountData
      });
    }

    // Update remaining
    debtor.amount += amountData;
    creditor.amount -= amountData;

    // If settled, move to next
    if (Math.abs(debtor.amount) < 1) i++;
    if (creditor.amount < 1) j++;
  }

  return {
    amount: balances[currentUserId] || 0,
    userBalances: balances,
    suggestedPayments
  };
}


/**
 * Get category info by ID
 */
export function getCategoryInfo(categoryId: string) {
  return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
}

/**
 * Generate a simple unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a simple invite code
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if (Math.random() > 0.5) code += Math.floor(Math.random() * 9);
  }
  return code.substring(0, 6).toUpperCase();
}

/**
 * Group expenses by month
 */
export function groupExpensesByMonth(expenses: Expense[]): Map<string, Expense[]> {
  const groups = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const date = new Date(expense.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(expense);
  }

  return groups;
}

/**
 * Format month key for display
 */
export function formatMonthKey(key: string): string {
  const [year, month] = key.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}
