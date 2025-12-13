import { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseCard } from '../components/expenses/ExpenseCard';
import { SettlementCard } from '../components/settlements/SettlementCard';
import { ExpenseForm } from '../components/expenses/ExpenseForm';
import { SettlementForm } from '../components/settlements/SettlementForm';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import type { Expense, Settlement, HistoryItem as ServerHistoryItem } from '../types';
import { CATEGORIES } from '../types';
import { formatMonthKey, formatCurrency } from '../utils/helpers';

// Union type for history items (supports both client-side and server-side data)
type HistoryItem = 
  | { type: 'expense'; data: Expense; date: string }
  | { type: 'settlement'; data: Settlement; date: string };

// Convert server HistoryItem to local format for rendering
function serverItemToLocal(item: ServerHistoryItem): HistoryItem {
  if (item.type === 'expense') {
    return {
      type: 'expense',
      date: item.date,
      data: {
        id: item.id,
        coupleId: '', // Not needed for display
        description: item.description || '',
        amount: item.amount,
        paidBy: item.paidBy,
        splitType: item.splitType || 'equal',
        partner1Share: item.partner1Share || 0,
        partner2Share: item.partner2Share || 0,
        category: item.category || 'other',
        date: item.date,
        note: item.note,
        createdAt: item.createdAt,
      },
    };
  } else {
    return {
      type: 'settlement',
      date: item.date,
      data: {
        id: item.id,
        coupleId: '', // Not needed for display
        amount: item.amount,
        paidBy: item.paidBy,
        paidTo: item.paidTo || '',
        date: item.date,
        note: item.note,
        createdAt: item.createdAt,
      },
    };
  }
}

// Pagination constants
const ITEMS_PER_PAGE = 20;

export function History() {
  const { expenses, settlements, couple, deleteExpense, deleteSettlement, isLoading, fetchHistory } = useApp();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null);
  const [deletingSettlement, setDeletingSettlement] = useState<Settlement | null>(null);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paidByFilter, setPaidByFilter] = useState<string>('all');

  // Server-side pagination state
  const [serverItems, setServerItems] = useState<HistoryItem[]>([]);
  const [serverNextToken, setServerNextToken] = useState<string | null>(null);
  const [serverTotalCount, setServerTotalCount] = useState<number>(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [useServerPagination, setUseServerPagination] = useState(false);
  const [serverError, setServerError] = useState(false);

  // Client-side pagination (fallback)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // Check if server-side pagination is available (couple has aggregates)
  const serverPaginationAvailable = couple && typeof couple.netBalance === 'number';

  // Load initial data from server when filters change
  const loadServerData = useCallback(async (reset: boolean = false) => {
    if (!couple?.id) return;
    
    setIsLoadingMore(true);
    setServerError(false);
    
    try {
      console.log('[History] Loading from server, reset:', reset);
      const result = await fetchHistory({
        coupleId: couple.id,
        limit: ITEMS_PER_PAGE,
        nextToken: reset ? null : serverNextToken,
        typeFilter: typeFilter === 'all' ? null : typeFilter,
        categoryFilter: categoryFilter === 'all' ? null : categoryFilter,
        paidByFilter: paidByFilter === 'all' ? null : paidByFilter,
      });

      const newItems = result.items.map(serverItemToLocal);
      
      if (reset) {
        setServerItems(newItems);
      } else {
        setServerItems(prev => [...prev, ...newItems]);
      }
      
      setServerNextToken(result.nextToken);
      setServerTotalCount(result.totalCount);
      setUseServerPagination(true);
      
      console.log('[History] Server data loaded:', {
        itemCount: newItems.length,
        totalCount: result.totalCount,
        hasMore: !!result.nextToken,
      });
    } catch (error) {
      console.error('[History] Server fetch error, falling back to client-side:', error);
      setServerError(true);
      setUseServerPagination(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [couple?.id, fetchHistory, serverNextToken, typeFilter, categoryFilter, paidByFilter]);

  // Try server-side loading when couple changes or on mount
  useEffect(() => {
    if (serverPaginationAvailable && !serverError) {
      loadServerData(true);
    }
  }, [serverPaginationAvailable]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset and reload when filters change
  useEffect(() => {
    if (useServerPagination && !serverError) {
      loadServerData(true);
    } else {
      setDisplayCount(ITEMS_PER_PAGE);
    }
  }, [typeFilter, categoryFilter, paidByFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side: Combine and sort expenses and settlements (fallback)
  const allItems = useMemo<HistoryItem[]>(() => {
    if (useServerPagination) return []; // Skip if using server
    
    const items: HistoryItem[] = [];
    
    // Add expenses
    for (const expense of expenses) {
      items.push({ type: 'expense', data: expense, date: expense.date });
    }
    
    // Add settlements
    for (const settlement of settlements) {
      items.push({ type: 'settlement', data: settlement, date: settlement.date });
    }
    
    // Sort by date descending, then by createdAt descending (most recent first)
    items.sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      
      // Same date - use createdAt for secondary sort (most recently created first)
      const aCreatedAt = a.data.createdAt ? new Date(a.data.createdAt).getTime() : 0;
      const bCreatedAt = b.data.createdAt ? new Date(b.data.createdAt).getTime() : 0;
      return bCreatedAt - aCreatedAt;
    });
    
    return items;
  }, [expenses, settlements, useServerPagination]);

  // Client-side: Apply filters (fallback)
  const filteredItems = useMemo(() => {
    if (useServerPagination) return []; // Skip if using server
    
    return allItems.filter(item => {
      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      
      // Category filter (only applies to expenses)
      if (categoryFilter !== 'all') {
        if (item.type !== 'expense') return false;
        if ((item.data as Expense).category !== categoryFilter) return false;
      }
      
      // Paid by filter
      if (paidByFilter !== 'all' && item.data.paidBy !== paidByFilter) return false;
      
      return true;
    });
  }, [allItems, typeFilter, categoryFilter, paidByFilter, useServerPagination]);

  // Displayed items: from server or client
  const displayedItems = useMemo(() => {
    if (useServerPagination) {
      return serverItems;
    }
    return filteredItems.slice(0, displayCount);
  }, [useServerPagination, serverItems, filteredItems, displayCount]);

  // Check if there are more items to load
  const hasMore = useServerPagination 
    ? serverNextToken !== null 
    : displayCount < filteredItems.length;

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (useServerPagination) {
      loadServerData(false);
    } else {
      setDisplayCount(c => c + ITEMS_PER_PAGE);
    }
  }, [useServerPagination, loadServerData]);

  // Group by month (using displayedItems for pagination)
  const groupedItems = useMemo(() => {
    const groups = new Map<string, HistoryItem[]>();
    
    for (const item of displayedItems) {
      const date = new Date(item.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }
    
    return groups;
  }, [displayedItems]);
  
  const sortedMonths = useMemo(() => 
    Array.from(groupedItems.keys()).sort().reverse(),
    [groupedItems]
  );

  const typeOptions = [
    { value: 'all', label: 'All Activity', emoji: '📋' },
    { value: 'expense', label: 'Expenses', emoji: '💳' },
    { value: 'settlement', label: 'Settlements', emoji: '💸' },
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories', emoji: '📋' },
    ...CATEGORIES.map(c => ({ value: c.id, label: c.label, emoji: c.emoji })),
  ];

  const paidByOptions = [
    { value: 'all', label: 'All' },
    { value: 'partner1', label: couple?.partner1Name || 'Partner 1' },
    { value: 'partner2', label: couple?.partner2Name || 'Partner 2' },
  ];

  const handleDeleteExpense = () => {
    if (deletingExpense) {
      deleteExpense(deletingExpense.id);
      setDeletingExpense(null);
    }
  };

  const handleDeleteSettlement = () => {
    if (deletingSettlement) {
      deleteSettlement(deletingSettlement.id);
      setDeletingSettlement(null);
    }
  };

  // Count items - prefer pre-computed aggregates from couple
  const expenseCount = useServerPagination && couple?.expenseCount != null
    ? couple.expenseCount
    : filteredItems.filter(i => i.type === 'expense').length;
  const settlementCount = useServerPagination && couple?.settlementCount != null
    ? couple.settlementCount
    : filteredItems.filter(i => i.type === 'settlement').length;
  
  // Remaining items for load more button
  const remainingCount = useServerPagination 
    ? serverTotalCount - serverItems.length 
    : filteredItems.length - displayCount;

  // Helper to get partner name for settlement delete confirmation
  const getSettlementDescription = (settlement: Settlement) => {
    const paidByName = settlement.paidBy === 'partner1' 
      ? couple?.partner1Name 
      : couple?.partner2Name;
    const paidToName = settlement.paidTo === 'partner1' 
      ? couple?.partner1Name 
      : couple?.partner2Name;
    return `${paidByName} → ${paidToName} (${formatCurrency(settlement.amount)})`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">📋 Activity History</h1>
        <p className="font-mono text-sm text-[var(--color-plum)]/70">
          {expenseCount} expense{expenseCount !== 1 ? 's' : ''}, {settlementCount} settlement{settlementCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="grid grid-cols-3 gap-3">
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              // Reset category filter when switching to settlements
              if (e.target.value === 'settlement') {
                setCategoryFilter('all');
              }
            }}
          />
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            disabled={typeFilter === 'settlement'}
          />
          <Select
            options={paidByOptions}
            value={paidByFilter}
            onChange={(e) => setPaidByFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Loading skeleton */}
      {(isLoading || (isLoadingMore && displayedItems.length === 0)) && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--color-plum)]/20" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[var(--color-plum)]/20 rounded w-3/4" />
                  <div className="h-3 bg-[var(--color-plum)]/10 rounded w-1/2" />
                </div>
                <div className="h-5 bg-[var(--color-plum)]/20 rounded w-20" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Items list */}
      {!isLoading && filteredItems.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-bold text-lg mb-2">No activity found</h3>
          <p className="font-mono text-sm text-[var(--color-plum)]/70">
            {allItems.length === 0 
              ? "You haven't added any expenses or settlements yet"
              : "Try adjusting your filters"}
          </p>
        </Card>
      )}

      {/* Items grouped by month */}
      {displayedItems.length > 0 && (
        <div className="space-y-8">
          {sortedMonths.map(monthKey => (
            <div key={monthKey}>
              {/* Month header */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-[var(--color-plum)]/60">
                  {formatMonthKey(monthKey)}
                </h2>
                <div className="flex-1 border-t-2 border-dashed border-[var(--color-plum)]/20" />
              </div>

              {/* Items for this month */}
              <div className="space-y-3">
                {groupedItems.get(monthKey)?.map(item => (
                  item.type === 'expense' ? (
                    <ExpenseCard
                      key={`expense-${item.data.id}`}
                      expense={item.data}
                      onEdit={() => setEditingExpense(item.data)}
                      onDelete={() => setDeletingExpense(item.data)}
                    />
                  ) : (
                    <SettlementCard
                      key={`settlement-${item.data.id}`}
                      settlement={item.data}
                      onEdit={() => setEditingSettlement(item.data)}
                      onDelete={() => setDeletingSettlement(item.data)}
                    />
                  )
                ))}
              </div>
            </div>
          ))}

          {/* Load More button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading...' : `Load More (${remainingCount} remaining)`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Edit Expense Modal */}
      <Modal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        size="lg"
      >
        {editingExpense && (
          <ExpenseForm
            expense={editingExpense}
            onSubmit={() => setEditingExpense(null)}
            onCancel={() => setEditingExpense(null)}
          />
        )}
      </Modal>

      {/* Edit Settlement Modal */}
      <Modal
        isOpen={!!editingSettlement}
        onClose={() => setEditingSettlement(null)}
        size="lg"
      >
        {editingSettlement && (
          <SettlementForm
            settlement={editingSettlement}
            onSubmit={() => setEditingSettlement(null)}
            onCancel={() => setEditingSettlement(null)}
          />
        )}
      </Modal>

      {/* Delete Expense Confirmation Modal */}
      <Modal
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        title="🗑️ Delete Expense?"
        size="sm"
      >
        <div className="text-center">
          <p className="font-mono text-sm mb-6">
            Are you sure you want to delete "{deletingExpense?.description}"?
            <br />
            <span className="text-[var(--color-plum)]/60">
              This can't be undone.
            </span>
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setDeletingExpense(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteExpense}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Settlement Confirmation Modal */}
      <Modal
        isOpen={!!deletingSettlement}
        onClose={() => setDeletingSettlement(null)}
        title="🗑️ Delete Settlement?"
        size="sm"
      >
        <div className="text-center">
          <p className="font-mono text-sm mb-6">
            Are you sure you want to delete this settlement?
            <br />
            <span className="font-bold text-[var(--color-mint)]">
              {deletingSettlement && getSettlementDescription(deletingSettlement)}
            </span>
            <br />
            <span className="text-[var(--color-plum)]/60">
              This will affect your balance. This can't be undone.
            </span>
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setDeletingSettlement(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteSettlement}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
