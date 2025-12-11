import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { Couple, Expense, Settlement, User, Balance } from '../types';
import { calculateBalance, generateId, generateInviteCode } from '../utils/helpers';

interface AppContextType {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;

  // Couple state
  couple: Couple | null;
  createCouple: (name: string, partnerName: string) => void;
  joinCouple: (inviteCode: string, partnerName: string) => Promise<{ success: boolean; error?: string }>;
  updateCouple: (updates: Partial<Couple>) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'coupleId' | 'createdAt' | 'updatedAt'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Settlements
  settlements: Settlement[];
  addSettlement: (settlement: Omit<Settlement, 'id' | 'coupleId' | 'createdAt'>) => void;

  // Calculated values
  balance: Balance;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Local storage keys
const STORAGE_KEYS = {
  USER: 'rickshare_user',
  COUPLE: 'rickshare_couple',
  EXPENSES: 'rickshare_expenses',
  SETTLEMENTS: 'rickshare_settlements',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      const savedCouple = localStorage.getItem(STORAGE_KEYS.COUPLE);
      const savedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      const savedSettlements = localStorage.getItem(STORAGE_KEYS.SETTLEMENTS);

      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedCouple) setCouple(JSON.parse(savedCouple));
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      if (savedSettlements) setSettlements(JSON.parse(savedSettlements));
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
    setIsLoading(false);
  }, []);

  // Save data to localStorage on change
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      if (couple) {
        localStorage.setItem(STORAGE_KEYS.COUPLE, JSON.stringify(couple));
      } else {
        localStorage.removeItem(STORAGE_KEYS.COUPLE);
      }
    }
  }, [couple, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    }
  }, [expenses, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
    }
  }, [settlements, isLoading]);

  // Auth functions
  const login = async (email: string, _password: string) => {
    // For now, simple local auth - will be replaced with Cognito
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network
    
    const newUser: User = {
      id: generateId(),
      email,
      name: email.split('@')[0],
    };
    setUser(newUser);
    setIsLoading(false);
  };

  const signup = async (email: string, _password: string, name: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newUser: User = {
      id: generateId(),
      email,
      name,
    };
    setUser(newUser);
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setCouple(null);
    setExpenses([]);
    setSettlements([]);
    localStorage.clear();
  };

  // Couple functions
  const createCouple = (name: string, partnerName: string) => {
    if (!user) return;
    
    const newCouple: Couple = {
      id: generateId(),
      name,
      partner1Id: user.id,
      partner1Name: partnerName,
      partner1Email: user.email,
      inviteCode: generateInviteCode(),
      defaultSplitPercent: 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCouple(newCouple);
  };

  const joinCouple = async (inviteCode: string, partnerName: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'You must be logged in to join a couple' };
    }
    
    // For localStorage demo: We need to find the couple by invite code
    // In a real app with GraphQL, this would query: listCouples(filter: { inviteCode: { eq: inviteCode } })
    
    // Check localStorage for any couple with this invite code
    const savedCouple = localStorage.getItem('rickshare_couple');
    if (savedCouple) {
      try {
        const existingCouple: Couple = JSON.parse(savedCouple);
        if (existingCouple.inviteCode === inviteCode) {
          const updatedCouple = {
            ...existingCouple,
            partner2Id: user.id,
            partner2Name: partnerName,
            partner2Email: user.email,
            inviteCode: undefined,
            updatedAt: new Date().toISOString(),
          };
          setCouple(updatedCouple);
          return { success: true };
        }
      } catch (e) {
        console.error('Error parsing couple from localStorage:', e);
      }
    }
    
    // TODO: When connected to real backend, query GraphQL here
    // const result = await API.graphql(graphqlOperation(listCouples, { filter: { inviteCode: { eq: inviteCode } } }));
    
    return { 
      success: false, 
      error: 'Invalid invite code. Make sure you entered it correctly, or ask your partner for a new code.' 
    };
  };

  const updateCouple = (updates: Partial<Couple>) => {
    if (!couple) return;
    setCouple({
      ...couple,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  // Expense functions
  const addExpense = (expense: Omit<Expense, 'id' | 'coupleId' | 'createdAt' | 'updatedAt'>) => {
    if (!couple) return;
    
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
      coupleId: couple.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(prev =>
      prev.map(exp =>
        exp.id === id
          ? { ...exp, ...updates, updatedAt: new Date().toISOString() }
          : exp
      )
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  // Settlement functions
  const addSettlement = (settlement: Omit<Settlement, 'id' | 'coupleId' | 'createdAt'>) => {
    if (!couple) return;
    
    const newSettlement: Settlement = {
      ...settlement,
      id: generateId(),
      coupleId: couple.id,
      createdAt: new Date().toISOString(),
    };
    setSettlements(prev => [newSettlement, ...prev]);
  };

  // Calculate balance
  const balance = calculateBalance(expenses, settlements);

  const value: AppContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    couple,
    createCouple,
    joinCouple,
    updateCouple,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    settlements,
    addSettlement,
    balance,
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

