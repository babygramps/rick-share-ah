// Core data types for Rick & Share-ah

export type GroupType = 'COUPLE' | 'GROUP';

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  name: string;
  email?: string | null;
  role?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Group {
  id: string;
  type: GroupType;
  name: string;
  inviteCode?: string | null;
  members?: {
    items: GroupMember[];
  };
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
}

// Deprecated Couple interface for refactoring support if needed, but ideally replaced by Group
export type Couple = Group;

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string; // userId
  splitType: string;

  // Legacy/Couple fields (optional now)
  partner1Share?: number | null;
  partner2Share?: number | null;

  // New: Map of userId -> cents
  shares?: string | null; // AWSJSON comes as string usually, might need parsing

  category: string;
  date: string;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  amount: number;
  paidBy: string; // userId
  paidTo: string; // userId
  date: string;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
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

export interface PaymentSuggestion {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface Balance {
  amount: number; // Net balance for current user
  userBalances?: Record<string, number>; // Net balance for each user ID
  suggestedPayments?: PaymentSuggestion[]; // Simplified debt transactions
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

export type LineItemAssignTo = 'partner1' | 'partner2' | 'split' | 'custom' | string; // userId for custom

export interface ReceiptLineItemAssignment extends ReceiptLineItem {
  id: string;
  assignTo: LineItemAssignTo;
  customPercent?: number;
}