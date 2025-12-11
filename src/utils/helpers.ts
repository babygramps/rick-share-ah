import type { Expense, Settlement, Balance } from '../types';
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
 * Calculate what each partner owes for an expense
 */
export function calculateExpenseSplit(expense: Expense): { partner1Owes: number; partner2Owes: number } {
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
 * Calculate the running balance between partners
 * Positive = Partner 2 owes Partner 1
 * Negative = Partner 1 owes Partner 2
 */
export function calculateBalance(expenses: Expense[], settlements: Settlement[]): Balance {
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
    amount: netBalance,
    partner1Total: partner1Paid,
    partner2Total: partner2Paid,
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
  }
  return code;
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

