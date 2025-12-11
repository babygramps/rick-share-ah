import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseCard } from '../components/expenses/ExpenseCard';
import { ExpenseForm } from '../components/expenses/ExpenseForm';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import type { Expense } from '../types';
import { CATEGORIES } from '../types';
import { groupExpensesByMonth, formatMonthKey } from '../utils/helpers';

export function History() {
  const { expenses, couple, deleteExpense } = useApp();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paidByFilter, setPaidByFilter] = useState<string>('all');

  // Apply filters
  const filteredExpenses = expenses.filter(expense => {
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) return false;
    if (paidByFilter !== 'all' && expense.paidBy !== paidByFilter) return false;
    return true;
  });

  // Group by month
  const groupedExpenses = groupExpensesByMonth(filteredExpenses);
  const sortedMonths = Array.from(groupedExpenses.keys()).sort().reverse();

  const categoryOptions = [
    { value: 'all', label: 'All Categories', emoji: '📋' },
    ...CATEGORIES.map(c => ({ value: c.id, label: c.label, emoji: c.emoji })),
  ];

  const paidByOptions = [
    { value: 'all', label: 'All' },
    { value: 'partner1', label: couple?.partner1Name || 'Partner 1' },
    { value: 'partner2', label: couple?.partner2Name || 'Partner 2' },
  ];

  const handleDelete = () => {
    if (deletingExpense) {
      deleteExpense(deletingExpense.id);
      setDeletingExpense(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">📋 Expense History</h1>
        <p className="font-mono text-sm text-[var(--color-plum)]/70">
          {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="grid grid-cols-2 gap-3">
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
          <Select
            options={paidByOptions}
            value={paidByFilter}
            onChange={(e) => setPaidByFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Expense list */}
      {filteredExpenses.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-bold text-lg mb-2">No expenses found</h3>
          <p className="font-mono text-sm text-[var(--color-plum)]/70">
            {expenses.length === 0 
              ? "You haven't added any expenses yet"
              : "Try adjusting your filters"}
          </p>
        </Card>
      ) : (
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

              {/* Expenses for this month */}
              <div className="space-y-3">
                {groupedExpenses.get(monthKey)?.map(expense => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onEdit={() => setEditingExpense(expense)}
                    onDelete={() => setDeletingExpense(expense)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
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

      {/* Delete Confirmation Modal */}
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
              onClick={handleDelete}
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

