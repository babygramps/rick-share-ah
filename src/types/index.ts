// Core data types for Rick & Share-ah

export interface Couple {
  id: string;
  owners: string[];  // Contains partner user IDs for multi-owner auth
  name: string;
  partner1Id: string;
  partner1Name: string;
  partner1Email: string;
  partner2Id?: string | null;
  partner2Name?: string | null;
  partner2Email?: string | null;
  inviteCode?: string | null;
  defaultSplitPercent: number;
  // Pre-computed aggregates (updated transactionally by Lambda)
  expenseCount?: number | null;
  settlementCount?: number | null;
  partner1TotalPaid?: number | null;
  partner2TotalPaid?: number | null;
  partner1TotalOwes?: number | null;
  partner2TotalOwes?: number | null;
  netBalance?: number | null;
  lastCalculatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  owners?: string[];  // Contains partner user IDs for multi-owner auth
  coupleId: string;
  description: string;
  amount: number;
  paidBy: string;
  splitType: string;
  partner1Share: number;
  partner2Share: number;
  category: string;
  date: string;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Settlement {
  id: string;
  owners?: string[];  // Contains partner user IDs for multi-owner auth
  coupleId: string;
  amount: number;
  paidBy: string;
  paidTo: string;
  date: string;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type ExpenseCategory =
  | 'food'
  | 'groceries'
  | 'transport'
  | 'home'
  | 'utilities'
  | 'entertainment'
  | 'shopping'
  | 'health'
  | 'travel'
  | 'gifts'
  | 'other';

export interface CategoryInfo {
  id: ExpenseCategory;
  label: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'food', label: 'Food & Dining', emoji: '🍕', color: '#FF6B6B' },
  { id: 'groceries', label: 'Groceries', emoji: '🛒', color: '#95D5B2' },
  { id: 'transport', label: 'Transport', emoji: '🚗', color: '#74C0FC' },
  { id: 'home', label: 'Home', emoji: '🏠', color: '#E4C1F9' },
  { id: 'utilities', label: 'Utilities', emoji: '💡', color: '#FFE66D' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬', color: '#FF6B6B' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#E4C1F9' },
  { id: 'health', label: 'Health', emoji: '💊', color: '#95D5B2' },
  { id: 'travel', label: 'Travel', emoji: '✈️', color: '#74C0FC' },
  { id: 'gifts', label: 'Gifts', emoji: '🎁', color: '#FF6B6B' },
  { id: 'other', label: 'Other', emoji: '📦', color: '#5C374C' },
];

export interface Balance {
  amount: number;
  partner1Total: number;
  partner2Total: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Receipt line items (from Textract)
export interface ReceiptLineItem {
  description?: string | null;
  price?: number | null; // cents
  quantity?: number | null;
}

export type LineItemAssignTo = 'partner1' | 'partner2' | 'split' | 'custom';

export interface ReceiptLineItemAssignment extends ReceiptLineItem {
  id: string;
  assignTo: LineItemAssignTo;
  customPercent?: number; // partner1 percent (0-100) when assignTo === 'custom'
}

// History item returned from getCoupleHistory query
export interface HistoryItem {
  id: string;
  type: 'expense' | 'settlement';
  date: string;
  createdAt: string;
  amount: number;
  paidBy: string;
  // Expense-specific fields
  description?: string | null;
  category?: string | null;
  splitType?: string | null;
  partner1Share?: number | null;
  partner2Share?: number | null;
  // Settlement-specific fields
  paidTo?: string | null;
  note?: string | null;
}

export interface HistoryConnection {
  items: HistoryItem[];
  nextToken: string | null;
  totalCount: number;
}

export interface HistoryQueryOptions {
  coupleId: string;
  limit?: number;
  nextToken?: string | null;
  typeFilter?: string | null;
  categoryFilter?: string | null;
  paidByFilter?: string | null;
}