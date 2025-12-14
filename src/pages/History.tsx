import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseCard } from '../components/expenses/ExpenseCard';
import { SettlementCard } from '../components/settlements/SettlementCard';
import { ExpenseForm } from '../components/expenses/ExpenseForm';
import { SettlementForm } from '../components/settlements/SettlementForm';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import type { Expense, Settlement } from '../types';
import { CATEGORIES } from '../types';
import { formatMonthKey, formatCurrency } from '../utils/helpers';

// Union type for history items
type HistoryItem = 
  | { type: 'expense'; data: Expense; date: string }
  | { type: 'settlement'; data: Settlement; date: string };

// Pagination constants
const ITEMS_PER_PAGE = 20;

export function History() {
  const { expenses, settlements, couple, deleteExpense, deleteSettlement, isLoading } = useApp();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null);
  const [deletingSettlement, setDeletingSettlement] = useState<Settlement | null>(null);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paidByFilter, setPaidByFilter] = useState<string>('all');

  // Client-side pagination
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // Combine and sort expenses and settlements
  const allItems = useMemo<HistoryItem[]>(() => {
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
  }, [expenses, settlements]);

  // Apply filters
  const filteredItems = useMemo(() => {
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
  }, [allItems, typeFilter, categoryFilter, paidByFilter]);

  // Paginated items
  const displayedItems = useMemo(() => {
    return filteredItems.slice(0, displayCount);
  }, [filteredItems, displayCount]);

  // Check if there are more items to load
  const hasMore = displayCount < filteredItems.length;
  const remainingCount = filteredItems.length - displayCount;

  // Handle load more
  const handleLoadMore = () => {
    setDisplayCount(c => c + ITEMS_PER_PAGE);
  };

  // Group by month
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
  const expenseCount = couple?.expenseCount != null
    ? couple.expenseCount
    : expenses.length;
  const settlementCount = couple?.settlementCount != null
    ? couple.settlementCount
    : settlements.length;

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
              // Reset pagination when filter changes
              setDisplayCount(ITEMS_PER_PAGE);
            }}
          />
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setDisplayCount(ITEMS_PER_PAGE);
            }}
            disabled={typeFilter === 'settlement'}
          />
          <Select
            options={paidByOptions}
            value={paidByFilter}
            onChange={(e) => {
              setPaidByFilter(e.target.value);
              setDisplayCount(ITEMS_PER_PAGE);
            }}
          />
        </div>
      </Card>

      {/* Loading skeleton */}
      {isLoading && (
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

      {/* Empty state */}
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
              >
                Load More ({remainingCount} remaining)
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
