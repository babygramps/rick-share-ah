import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  confirmSignUp,
  fetchUserAttributes,
  resetPassword,
  confirmResetPassword
} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import type { Group, GroupMember, Expense, Settlement, User, Balance, GroupType } from '../types';
import { calculateGroupBalance, generateInviteCode } from '../utils/helpers';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';

// Lazy GraphQL client - only created after Amplify is configured
// Uses userPool auth for owner-based authorization
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any = null;
const getClient = () => {
  if (!_client) {
    _client = generateClient({ authMode: 'userPool' });
  }
  return _client;
};

interface AppContextType {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsConfirmation: boolean;
  pendingEmail: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; needsConfirmation?: boolean; error?: string }>;
  confirmAccount: (code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  confirmPasswordReset: (code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  setPasswordResetEmail: (email: string) => void;

  // Group state
  group: Group | null;
  members: GroupMember[];
  createGroup: (name: string, type: GroupType, memberName: string) => Promise<{ success: boolean; error?: string }>;
  joinGroup: (inviteCode: string, memberName: string) => Promise<{ success: boolean; error?: string }>;
  updateGroup: (updates: Partial<Group>) => Promise<void>;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'groupId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addExpenseBatch: (
    expenses: Array<Omit<Expense, 'id' | 'groupId' | 'createdAt' | 'updatedAt'>>
  ) => Promise<{ created: number; failed: number }>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Settlements
  settlements: Settlement[];
  addSettlement: (settlement: Omit<Settlement, 'id' | 'groupId' | 'createdAt'>) => Promise<void>;
  updateSettlement: (id: string, updates: Partial<Settlement>) => Promise<void>;
  deleteSettlement: (id: string) => Promise<void>;

  // Calculated values
  balance: Balance;

  // Refresh data
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [passwordResetEmail, setPasswordResetEmail] = useState<string | null>(null);

  // Check for existing auth session on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      setUser({
        id: currentUser.userId,
        email: attributes.email || '',
        name: attributes.name || attributes.email?.split('@')[0] || 'User',
      });

      // Load user's group data
      await loadUserData(currentUser.userId);
    } catch (error) {
      // Not signed in
      console.log('No authenticated user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      // Find memberships for this user
      const membershipResult = await getClient().graphql({
        query: queries.listGroupMembers,
        variables: {
          filter: { userId: { eq: userId } }
        }
      });

      const memberships = (membershipResult as any).data?.listGroupMembers?.items || [];

      if (memberships.length > 0) {
        // Use the first group found (Multi-group support can be added later)
        const membership = memberships[0];
        let userGroup = membership.group;

        // If nested group data is missing (e.g. depth limit), fetch it directly
        if (!userGroup || !userGroup.name) {
          const groupResult = await getClient().graphql({
            query: queries.getGroup,
            variables: { id: membership.groupId }
          });
          userGroup = (groupResult as any).data?.getGroup;
        }

        if (userGroup) {
          setGroup(userGroup);
          await loadGroupData(userGroup.id);
        }
      } else {
        setGroup(null);
        setMembers([]);
        setExpenses([]);
        setSettlements([]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadGroupData = async (groupId: string) => {
    try {
      console.log('Loading group data for groupId:', groupId);

      // Load Members
      const membersResult = await getClient().graphql({
        query: queries.listGroupMembers,
        variables: { filter: { groupId: { eq: groupId } } }
      });
      const loadedMembers = (membersResult as any).data?.listGroupMembers?.items || [];
      setMembers(loadedMembers);

      // Load expenses
      const expenseResult = await getClient().graphql({
        query: queries.expensesByGroup,
        variables: { groupId }
      });
      const loadedExpenses = (expenseResult as any).data?.expensesByGroup?.items || [];
      // Sort client-side by date descending
      loadedExpenses.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setExpenses(loadedExpenses);

      // Load settlements
      const settlementResult = await getClient().graphql({
        query: queries.settlementsByGroup,
        variables: { groupId }
      });
      const loadedSettlements = (settlementResult as any).data?.settlementsByGroup?.items || [];
      // Sort client-side by date descending
      loadedSettlements.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSettlements(loadedSettlements);
    } catch (error) {
      console.error('Error loading group data:', error);
    }
  };

  const refreshData = useCallback(async () => {
    if (user) {
      await loadUserData(user.id);
    }
  }, [user]);

  // Auth functions
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await signIn({ username: email, password });
      if (result.isSignedIn) {
        await checkAuthState();
        return { success: true };
      } else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        setPendingEmail(email);
        setNeedsConfirmation(true);
        setIsLoading(false);
        return { success: false, error: 'Please verify your email first' };
      }
      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
      if (error.name === 'UserNotConfirmedException') {
        setPendingEmail(email);
        setNeedsConfirmation(true);
        return { success: false, error: 'Please verify your email first' };
      }
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; needsConfirmation?: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name,
          },
        },
      });
      setIsLoading(false);
      if (result.isSignUpComplete) {
        return { success: true };
      } else {
        setPendingEmail(email);
        setNeedsConfirmation(true);
        return { success: true, needsConfirmation: true };
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setIsLoading(false);
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const confirmAccount = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!pendingEmail) return { success: false, error: 'No pending email to confirm' };
    try {
      await confirmSignUp({ username: pendingEmail, confirmationCode: code });
      setNeedsConfirmation(false);
      return { success: true };
    } catch (error: any) {
      console.error('Confirmation error:', error);
      return { success: false, error: error.message || 'Confirmation failed' };
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setGroup(null);
    setMembers([]);
    setExpenses([]);
    setSettlements([]);
    setNeedsConfirmation(false);
    setPendingEmail(null);
    setPasswordResetEmail(null);
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await resetPassword({ username: email });
      setPasswordResetEmail(email);
      return { success: true };
    } catch (error: any) {
      console.error('[auth] requestPasswordReset.error', error);
      return { success: false, error: error.message || 'Failed to send reset code' };
    }
  };

  const confirmPasswordReset = async (code: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!passwordResetEmail) return { success: false, error: 'No email address for password reset' };
    try {
      await confirmResetPassword({
        username: passwordResetEmail,
        confirmationCode: code,
        newPassword,
      });
      setPasswordResetEmail(null);
      return { success: true };
    } catch (error: any) {
      console.error('[auth] confirmPasswordReset.error', error);
      return { success: false, error: error.message || 'Failed to reset password' };
    }
  };

  // Group functions
  const createGroup = async (name: string, type: GroupType, memberName: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      const inviteCode = generateInviteCode();

      const groupResult = await getClient().graphql({
        query: mutations.createGroup,
        variables: {
          input: {
            name,
            type,
            inviteCode,
          }
        }
      });
      const newGroup = (groupResult as any).data?.createGroup;

      if (!newGroup) throw new Error('Failed to create group record');

      const memberResult = await getClient().graphql({
        query: mutations.createGroupMember,
        variables: {
          input: {
            groupId: newGroup.id,
            userId: user.id,
            name: memberName,
            email: user.email,
            role: 'owner'
          }
        }
      });
      const newMember = (memberResult as any).data?.createGroupMember;

      setGroup(newGroup);
      setMembers([newMember]);
      return { success: true };

    } catch (error: any) {
      console.error('Create group error:', error);
      return { success: false, error: error.message || 'Failed to create group' };
    }
  };

  const joinGroup = async (inviteCode: string, memberName: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      const result = await getClient().graphql({
        query: queries.groupsByInviteCode,
        variables: {
          inviteCode: inviteCode,
          limit: 1
        }
      });

      const groups = (result as any).data?.groupsByInviteCode?.items || [];

      if (groups.length === 0) {
        return { success: false, error: 'Invalid invite code. Please check and try again.' };
      }

      const groupToJoin = groups[0];

      if (groupToJoin.type === 'COUPLE') {
        const membersCheck = await getClient().graphql({
          query: queries.listGroupMembers,
          variables: { filter: { groupId: { eq: groupToJoin.id } } }
        });
        const count = (membersCheck as any).data?.listGroupMembers?.items?.length || 0;
        if (count >= 2) {
          return { success: false, error: 'This couple already has two partners.' };
        }
      }

      const memberResult = await getClient().graphql({
        query: mutations.createGroupMember,
        variables: {
          input: {
            groupId: groupToJoin.id,
            userId: user.id,
            name: memberName,
            email: user.email,
            role: 'member'
          }
        }
      });

      const newMember = (memberResult as any).data?.createGroupMember;
      if (newMember) {
        setGroup(groupToJoin);
        await loadGroupData(groupToJoin.id);
        return { success: true };
      }

      return { success: false, error: 'Failed to join group' };
    } catch (error: any) {
      console.error('Join group error:', error);
      return { success: false, error: error.message || 'Failed to join group' };
    }
  };

  const updateGroup = async (updates: Partial<Group>) => {
    if (!group) return;

    try {
      const result = await getClient().graphql({
        query: mutations.updateGroup,
        variables: {
          input: {
            id: group.id,
            ...updates,
          }
        }
      });
      const updatedGroup = (result as any).data?.updateGroup;
      if (updatedGroup) {
        setGroup(updatedGroup);
      }
    } catch (error) {
      console.error('Update group error:', error);
    }
  };

  // Expense functions
  const addExpense = async (expense: Omit<Expense, 'id' | 'groupId' | 'createdAt' | 'updatedAt'>) => {
    if (!group) return;

    try {
      const result = await getClient().graphql({
        query: mutations.createExpense,
        variables: {
          input: {
            groupId: group.id,
            ...expense,
          }
        }
      });

      const newExpense = (result as any).data?.createExpense;
      if (newExpense) {
        setExpenses(prev => [newExpense, ...prev]);
      }
    } catch (error) {
      console.error('Add expense error:', error);
    }
  };

  const addExpenseBatch: AppContextType['addExpenseBatch'] = async (batch) => {
    if (!group) return { created: 0, failed: batch.length };

    console.log('[csv-import] addExpenseBatch.start', { count: batch.length, groupId: group.id });

    const created: Expense[] = [];
    let failed = 0;

    for (let i = 0; i < batch.length; i += 1) {
      const expense = batch[i];
      try {
        const result = await getClient().graphql({
          query: mutations.createExpense,
          variables: {
            input: {
              groupId: group.id,
              ...expense,
            }
          }
        });

        const newExpense = (result as any).data?.createExpense;
        if (newExpense) {
          created.push(newExpense);
        } else {
          failed += 1;
          console.warn('[csv-import] addExpenseBatch.missingResponse', { index: i });
        }
      } catch (error) {
        failed += 1;
        console.error('[csv-import] addExpenseBatch.itemError', { index: i, error });
      }
    }

    if (created.length > 0) {
      setExpenses((prev) => {
        const next = [...created, ...prev];
        next.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return next;
      });
    }
    return { created: created.length, failed };
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const result = await getClient().graphql({
        query: mutations.updateExpense,
        variables: {
          input: {
            id,
            ...updates,
          }
        }
      });
      const updatedExpense = (result as any).data?.updateExpense;
      if (updatedExpense) {
        setExpenses(prev =>
          prev.map(exp => (exp.id === id ? updatedExpense : exp))
        );
      }
    } catch (error) {
      console.error('Update expense error:', error);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await getClient().graphql({
        query: mutations.deleteExpense,
        variables: {
          input: { id }
        }
      });
      setExpenses(prev => prev.filter(exp => exp.id !== id));
    } catch (error) {
      console.error('Delete expense error:', error);
    }
  };

  // Settlement functions
  const addSettlement = async (settlement: Omit<Settlement, 'id' | 'groupId' | 'createdAt'>) => {
    if (!group) return;
    try {
      const result = await getClient().graphql({
        query: mutations.createSettlement,
        variables: {
          input: {
            groupId: group.id,
            ...settlement,
          }
        }
      });
      const newSettlement = (result as any).data?.createSettlement;
      if (newSettlement) {
        setSettlements(prev => [newSettlement, ...prev]);
      }
    } catch (error) {
      console.error('Add settlement error:', error);
    }
  };

  const updateSettlement = async (id: string, updates: Partial<Settlement>) => {
    try {
      const result = await getClient().graphql({
        query: mutations.updateSettlement,
        variables: {
          input: {
            id,
            ...updates,
          }
        }
      });
      const updatedSettlement = (result as any).data?.updateSettlement;
      if (updatedSettlement) {
        setSettlements(prev =>
          prev.map(s => (s.id === id ? updatedSettlement : s))
        );
      }
    } catch (error) {
      console.error('Update settlement error:', error);
    }
  };

  const deleteSettlement = async (id: string) => {
    try {
      await getClient().graphql({
        query: mutations.deleteSettlement,
        variables: {
          input: { id }
        }
      });
      setSettlements(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Delete settlement error:', error);
    }
  };

  // Calculate balance
  const balance = calculateGroupBalance(expenses, settlements, members, user?.id || '');

  const value: AppContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    needsConfirmation,
    pendingEmail,
    login,
    signup,
    confirmAccount,
    logout,
    requestPasswordReset,
    confirmPasswordReset,
    setPasswordResetEmail,
    group,
    members,
    createGroup,
    joinGroup,
    updateGroup,
    expenses,
    addExpense,
    addExpenseBatch,
    updateExpense,
    deleteExpense,
    settlements,
    addSettlement,
    updateSettlement,
    deleteSettlement,
    balance,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
