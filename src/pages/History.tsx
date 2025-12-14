import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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

// Debounce hook for search performance
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Union type for history items
type HistoryItem = 
  | { type: 'expense'; data: Expense; date: string }
  | { type: 'settlement'; data: Settlement; date: string };

const ITEMS_PER_PAGE = 15;

export function History() {
  const { expenses, settlements, couple, deleteExpense, deleteSettlement } = useApp();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null);
  const [deletingSettlement, setDeletingSettlement] = useState<Settlement | null>(null);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paidByFilter, setPaidByFilter] = useState<string>('all');
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // Create a map for quick category label lookup
  const categoryLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of CATEGORIES) {
      map.set(cat.id, cat.label.toLowerCase());
    }
    return map;
  }, []);
  
  // Helper to check if an item matches the search query
  const itemMatchesSearch = useCallback((item: HistoryItem, query: string): boolean => {
    if (!query) return true;
    
    const searchLower = query.toLowerCase().trim();
    if (!searchLower) return true;
    
    // Search in amount (formatted and raw)
    const amount = item.data.amount;
    const amountStr = amount.toString();
    const amountFormatted = formatCurrency(amount).toLowerCase();
    if (amountStr.includes(searchLower) || amountFormatted.includes(searchLower)) {
      return true;
    }
    
    // Search in date
    const dateStr = new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).toLowerCase();
    if (dateStr.includes(searchLower)) {
      return true;
    }
    
    if (item.type === 'expense') {
      const expense = item.data as Expense;
      
      // Search in description
      if (expense.description.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in note
      if (expense.note?.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in category label
      const categoryLabel = categoryLabelMap.get(expense.category) || '';
      if (categoryLabel.includes(searchLower)) {
        return true;
      }
      
      // Search by partner name
      const paidByName = expense.paidBy === 'partner1' 
        ? couple?.partner1Name?.toLowerCase() 
        : couple?.partner2Name?.toLowerCase();
      if (paidByName?.includes(searchLower)) {
        return true;
      }
    } else {
      const settlement = item.data as Settlement;
      
      // Search in note
      if (settlement.note?.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by partner names
      const paidByName = settlement.paidBy === 'partner1' 
        ? couple?.partner1Name?.toLowerCase() 
        : couple?.partner2Name?.toLowerCase();
      const paidToName = settlement.paidTo === 'partner1' 
        ? couple?.partner1Name?.toLowerCase() 
        : couple?.partner2Name?.toLowerCase();
      if (paidByName?.includes(searchLower) || paidToName?.includes(searchLower)) {
        return true;
      }
      
      // Search for "settlement" keyword
      if ('settlement'.includes(searchLower)) {
        return true;
      }
    }
    
    return false;
  }, [categoryLabelMap, couple]);

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

  // Apply filters and search
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      
      // Category filter (only applies to expenses)
      if (categoryFilter !== 'all') {
        if (item.type !== 'expense') return false;
        if (item.data.category !== categoryFilter) return false;
      }
      
      // Paid by filter
      if (paidByFilter !== 'all' && item.data.paidBy !== paidByFilter) return false;
      
      // Search filter
      if (debouncedSearch && !itemMatchesSearch(item, debouncedSearch)) return false;
      
      return true;
    });
  }, [allItems, typeFilter, categoryFilter, paidByFilter, debouncedSearch, itemMatchesSearch]);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, categoryFilter, paidByFilter, debouncedSearch]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  
  // Clamp current page to valid range (derived value, no state update needed)
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  
  // Auto-correct page if it's out of range (e.g., after deleting items)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  
  // Get items for current page
  const paginatedItems = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, validCurrentPage]);

  // Group paginated items by month
  const groupedItems = useMemo(() => {
    const groups = new Map<string, HistoryItem[]>();
    
    for (const item of paginatedItems) {
      const date = new Date(item.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }
    
    return groups;
  }, [paginatedItems]);
  
  const sortedMonths = useMemo(() => 
    Array.from(groupedItems.keys()).sort().reverse(),
    [groupedItems]
  );

  // Pagination handlers
  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Clear all filters and search
  const clearAllFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setPaidByFilter('all');
  };
  
  // Check if any filters are active
  const hasActiveFilters = typeFilter !== 'all' || categoryFilter !== 'all' || paidByFilter !== 'all' || debouncedSearch !== '';

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

  // Count items (from full filtered list, not paginated)
  const expenseCount = filteredItems.filter(i => i.type === 'expense').length;
  const settlementCount = filteredItems.filter(i => i.type === 'settlement').length;
  
  // Current page range for display
  const startItem = filteredItems.length > 0 ? (validCurrentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endItem = Math.min(validCurrentPage * ITEMS_PER_PAGE, filteredItems.length);

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
          {filteredItems.length > ITEMS_PER_PAGE && (
            <span className="ml-2">
              • Showing {startItem}–{endItem} of {filteredItems.length}
            </span>
          )}
        </p>
      </div>

      {/* Search & Filters */}
      <Card padding="sm">
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
              🔍
            </span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search expenses, notes, amounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-brutal w-full pl-10 pr-10 py-2.5 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg hover:scale-110 transition-transform"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Filter dropdowns */}
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
          
          {/* Active filters indicator & clear button */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                {debouncedSearch && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-sunshine)]/30 border-2 border-[var(--color-plum)] text-xs font-mono rounded">
                    🔍 "{debouncedSearch.length > 15 ? debouncedSearch.slice(0, 15) + '…' : debouncedSearch}"
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:text-[var(--color-coral)]"
                    >
                      ×
                    </button>
                  </span>
                )}
                {typeFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-sky)]/30 border-2 border-[var(--color-plum)] text-xs font-mono rounded">
                    {typeOptions.find(o => o.value === typeFilter)?.emoji} {typeOptions.find(o => o.value === typeFilter)?.label}
                    <button
                      onClick={() => setTypeFilter('all')}
                      className="ml-1 hover:text-[var(--color-coral)]"
                    >
                      ×
                    </button>
                  </span>
                )}
                {categoryFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-lavender)]/30 border-2 border-[var(--color-plum)] text-xs font-mono rounded">
                    {categoryOptions.find(o => o.value === categoryFilter)?.emoji} {categoryOptions.find(o => o.value === categoryFilter)?.label}
                    <button
                      onClick={() => setCategoryFilter('all')}
                      className="ml-1 hover:text-[var(--color-coral)]"
                    >
                      ×
                    </button>
                  </span>
                )}
                {paidByFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-sage)]/30 border-2 border-[var(--color-plum)] text-xs font-mono rounded">
                    👤 {paidByOptions.find(o => o.value === paidByFilter)?.label}
                    <button
                      onClick={() => setPaidByFilter('all')}
                      className="ml-1 hover:text-[var(--color-coral)]"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
              <button
                onClick={clearAllFilters}
                className="text-xs font-mono text-[var(--color-plum)]/70 hover:text-[var(--color-coral)] underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Items list */}
      {filteredItems.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-5xl mb-4">{debouncedSearch ? '🔍' : '📭'}</div>
          <h3 className="font-bold text-lg mb-2">
            {debouncedSearch 
              ? `No results for "${debouncedSearch.length > 20 ? debouncedSearch.slice(0, 20) + '…' : debouncedSearch}"`
              : 'No activity found'
            }
          </h3>
          <p className="font-mono text-sm text-[var(--color-plum)]/70 mb-4">
            {allItems.length === 0 
              ? "You haven't added any expenses or settlements yet"
              : debouncedSearch
                ? "Try different search terms or clear filters"
                : "Try adjusting your filters"
            }
          </p>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
            >
              Clear all filters
            </Button>
          )}
        </Card>
      ) : (
        <>
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
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Card padding="sm" className="mt-6">
              <div className="flex items-center justify-between">
                {/* Previous button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToPage(validCurrentPage - 1)}
                  disabled={validCurrentPage === 1}
                  className="min-w-[100px]"
                >
                  ← Prev
                </Button>

                {/* Page info and quick navigation */}
                <div className="flex items-center gap-2">
                  {/* First page */}
                  {validCurrentPage > 2 && (
                    <>
                      <button
                        onClick={() => goToPage(1)}
                        className="font-mono text-sm px-2 py-1 hover:bg-[var(--color-plum)]/10 rounded transition-colors"
                      >
                        1
                      </button>
                      {validCurrentPage > 3 && (
                        <span className="font-mono text-sm text-[var(--color-plum)]/50">…</span>
                      )}
                    </>
                  )}

                  {/* Page numbers around current */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show pages close to current page
                      const distance = Math.abs(page - validCurrentPage);
                      return distance <= 1;
                    })
                    .map(page => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`
                          font-mono text-sm px-3 py-1 rounded transition-colors
                          ${page === validCurrentPage
                            ? 'bg-[var(--color-plum)] text-white font-bold'
                            : 'hover:bg-[var(--color-plum)]/10'
                          }
                        `}
                      >
                        {page}
                      </button>
                    ))
                  }

                  {/* Last page */}
                  {validCurrentPage < totalPages - 1 && (
                    <>
                      {validCurrentPage < totalPages - 2 && (
                        <span className="font-mono text-sm text-[var(--color-plum)]/50">…</span>
                      )}
                      <button
                        onClick={() => goToPage(totalPages)}
                        className="font-mono text-sm px-2 py-1 hover:bg-[var(--color-plum)]/10 rounded transition-colors"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                {/* Next button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToPage(validCurrentPage + 1)}
                  disabled={validCurrentPage === totalPages}
                  className="min-w-[100px]"
                >
                  Next →
                </Button>
              </div>
            </Card>
          )}
        </>
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
