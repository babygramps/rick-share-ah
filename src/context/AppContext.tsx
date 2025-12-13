import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  signIn, 
  signUp, 
  signOut, 
  getCurrentUser,
  confirmSignUp,
  fetchUserAttributes
} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import type { Couple, Expense, Settlement, User, Balance } from '../types';
import { calculateBalance, generateInviteCode } from '../utils/helpers';
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

  // Couple state
  couple: Couple | null;
  createCouple: (name: string, partnerName: string) => Promise<{ success: boolean; error?: string }>;
  joinCouple: (inviteCode: string, partnerName: string) => Promise<{ success: boolean; error?: string }>;
  updateCouple: (updates: Partial<Couple>) => Promise<void>;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'coupleId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addExpenseBatch: (
    expenses: Array<Omit<Expense, 'id' | 'coupleId' | 'createdAt' | 'updatedAt'>>
  ) => Promise<{ created: number; failed: number }>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Settlements
  settlements: Settlement[];
  addSettlement: (settlement: Omit<Settlement, 'id' | 'coupleId' | 'createdAt'>) => Promise<void>;
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
  const [couple, setCouple] = useState<Couple | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

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
      
      // Load user's couple data
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
      // Find couple where user is partner1 or partner2
      const coupleResult = await getClient().graphql({
        query: queries.listCouples,
        variables: {
          filter: {
            or: [
              { partner1Id: { eq: userId } },
              { partner2Id: { eq: userId } }
            ]
          }
        }
      });

      const couples = (coupleResult as any).data?.listCouples?.items || [];
      
      if (couples.length > 0) {
        const userCouple = couples[0];
        setCouple(userCouple);
        
        // Load expenses and settlements for this couple
        await loadCoupleData(userCouple.id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadCoupleData = async (coupleId: string) => {
    try {
      console.log('Loading couple data for coupleId:', coupleId);
      
      // Load expenses (no sortDirection - index doesn't have a sort key)
      const expenseResult = await getClient().graphql({
        query: queries.expensesByCoupleId,
        variables: { coupleId }
      });
      console.log('Expense query result:', expenseResult);
      const loadedExpenses = (expenseResult as any).data?.expensesByCoupleId?.items || [];
      // Sort client-side by date descending
      loadedExpenses.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      console.log('Loaded expenses:', loadedExpenses.length, loadedExpenses);
      setExpenses(loadedExpenses);

      // Load settlements (no sortDirection - index doesn't have a sort key)
      const settlementResult = await getClient().graphql({
        query: queries.settlementsByCoupleId,
        variables: { coupleId }
      });
      console.log('Settlement query result:', settlementResult);
      const loadedSettlements = (settlementResult as any).data?.settlementsByCoupleId?.items || [];
      // Sort client-side by date descending
      loadedSettlements.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      console.log('Loaded settlements:', loadedSettlements.length);
      setSettlements(loadedSettlements);
    } catch (error) {
      console.error('Error loading couple data:', error);
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
    if (!pendingEmail) {
      return { success: false, error: 'No pending email to confirm' };
    }

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
    setCouple(null);
    setExpenses([]);
    setSettlements([]);
    setNeedsConfirmation(false);
    setPendingEmail(null);
  };

  // Couple functions
  const createCouple = async (name: string, partnerName: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      const inviteCode = generateInviteCode();
      
      const result = await getClient().graphql({
        query: mutations.createCouple,
        variables: {
          input: {
            name,
            partner1Id: user.id,
            partner1Name: partnerName,
            partner1Email: user.email,
            inviteCode,
            defaultSplitPercent: 50,
          }
        }
      });

      const newCouple = (result as any).data?.createCouple;
      if (newCouple) {
        setCouple(newCouple);
        return { success: true };
      }
      
      return { success: false, error: 'Failed to create couple' };
    } catch (error: any) {
      console.error('Create couple error:', error);
      return { success: false, error: error.message || 'Failed to create couple' };
    }
  };

  const joinCouple = async (inviteCode: string, partnerName: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      // Find couple by invite code
      const result = await getClient().graphql({
        query: queries.listCouples,
        variables: {
          filter: { inviteCode: { eq: inviteCode } }
        }
      });

      const couples = (result as any).data?.listCouples?.items || [];
      
      if (couples.length === 0) {
        return { success: false, error: 'Invalid invite code. Please check and try again.' };
      }

      const coupleToJoin = couples[0];
      
      if (coupleToJoin.partner2Id) {
        return { success: false, error: 'This couple already has two partners.' };
      }

      // Update the couple to add partner2
      // Note: We don't clear inviteCode here because partner2 doesn't have permission
      // to modify owner-protected fields. The code becomes invalid anyway once partner2Id is set.
      const updateResult = await getClient().graphql({
        query: mutations.updateCouple,
        variables: {
          input: {
            id: coupleToJoin.id,
            partner2Id: user.id,
            partner2Name: partnerName,
            partner2Email: user.email,
          }
        }
      });

      const updatedCouple = (updateResult as any).data?.updateCouple;
      if (updatedCouple) {
        setCouple(updatedCouple);
        await loadCoupleData(updatedCouple.id);
        return { success: true };
      }

      return { success: false, error: 'Failed to join couple' };
    } catch (error: any) {
      console.error('Join couple error:', error);
      return { success: false, error: error.message || 'Failed to join couple' };
    }
  };

  const updateCouple = async (updates: Partial<Couple>) => {
    if (!couple) return;

    try {
      const result = await getClient().graphql({
        query: mutations.updateCouple,
        variables: {
          input: {
            id: couple.id,
            ...updates,
          }
        }
      });

      const updatedCouple = (result as any).data?.updateCouple;
      if (updatedCouple) {
        setCouple(updatedCouple);
      }
    } catch (error) {
      console.error('Update couple error:', error);
    }
  };

  // Expense functions
  const addExpense = async (expense: Omit<Expense, 'id' | 'coupleId' | 'createdAt' | 'updatedAt'>) => {
    if (!couple) return;

    try {
      const result = await getClient().graphql({
        query: mutations.createExpense,
        variables: {
          input: {
            coupleId: couple.id,
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
    if (!couple) return { created: 0, failed: batch.length };

    console.log('[csv-import] addExpenseBatch.start', { count: batch.length, coupleId: couple.id });

    const created: Expense[] = [];
    let failed = 0;

    for (let i = 0; i < batch.length; i += 1) {
      const expense = batch[i];
      try {
        const result = await getClient().graphql({
          query: mutations.createExpense,
          variables: {
            input: {
              coupleId: couple.id,
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

      if ((i + 1) % 25 === 0) {
        console.log('[csv-import] addExpenseBatch.progress', { done: i + 1, total: batch.length, created: created.length, failed });
      }
    }

    if (created.length > 0) {
      setExpenses((prev) => {
        const next = [...created, ...prev];
        next.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return next;
      });
    }

    console.log('[csv-import] addExpenseBatch.done', { created: created.length, failed });
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
  const addSettlement = async (settlement: Omit<Settlement, 'id' | 'coupleId' | 'createdAt'>) => {
    if (!couple) return;

    try {
      const result = await getClient().graphql({
        query: mutations.createSettlement,
        variables: {
          input: {
            coupleId: couple.id,
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
  const balance = calculateBalance(expenses, settlements);

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
    couple,
    createCouple,
    joinCouple,
    updateCouple,
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
