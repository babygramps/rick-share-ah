// Core data types for Rick & Share-ah

export interface Couple {
  id: string;
  name: string;
  partner1Id: string;
  partner1Name: string;
  partner1Email: string;
  partner2Id?: string;
  partner2Name?: string;
  partner2Email?: string;
  inviteCode?: string;
  defaultSplitPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  coupleId: string;
  description: string;
  amount: number;
  paidBy: 'partner1' | 'partner2';
  splitType: 'equal' | 'percentage' | 'exact';
  partner1Share: number;
  partner2Share: number;
  category: ExpenseCategory;
  date: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  id: string;
  coupleId: string;
  amount: number;
  paidBy: 'partner1' | 'partner2';
  paidTo: 'partner1' | 'partner2';
  date: string;
  note?: string;
  createdAt: string;
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
