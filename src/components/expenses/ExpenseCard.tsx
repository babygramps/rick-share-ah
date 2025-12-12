import type { Expense } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate, getCategoryInfo, calculateExpenseSplit } from '../../utils/helpers';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function ExpenseCard({ expense, onEdit, onDelete, showActions = true }: ExpenseCardProps) {
  const { couple } = useApp();
  const categoryInfo = getCategoryInfo(expense.category);
  const split = calculateExpenseSplit(expense);
  
  const paidByName = expense.paidBy === 'partner1' 
    ? couple?.partner1Name 
    : couple?.partner2Name || 'Partner 2';
  
  const otherPartnerName = expense.paidBy === 'partner1'
    ? couple?.partner2Name || 'Partner 2'
    : couple?.partner1Name;

  const amountOwed = expense.paidBy === 'partner1' 
    ? split.partner2Owes 
    : split.partner1Owes;

  return (
    <Card 
      hover 
      padding="none" 
      className="overflow-hidden animate-slide-up"
    >
      <div className="flex">
        {/* Category color bar */}
        <div 
          className="w-2 flex-shrink-0"
          style={{ backgroundColor: categoryInfo.color }}
        />
        
        <div className="flex-1 min-w-0 p-4">
          {/* Header: emoji, description, amount */}
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{categoryInfo.emoji}</span>
            
            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="font-bold text-lg truncate" title={expense.description}>
                {expense.description}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 font-mono text-xs text-[var(--color-plum)]/70">
                <span>{formatDate(expense.date)}</span>
                <span className="bg-[var(--color-cream)] px-2 py-0.5 border border-[var(--color-plum)]/20">
                  {categoryInfo.label}
                </span>
              </div>
            </div>

            <p className="font-mono text-2xl font-bold flex-shrink-0 text-right">
              {formatCurrency(expense.amount)}
            </p>
          </div>

          {/* Payment info */}
          <div className="mt-3 pt-3 border-t-2 border-dashed border-[var(--color-plum)]/20">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span 
                  className="px-2 py-1 text-xs font-mono font-bold uppercase border-2 border-[var(--color-plum)] whitespace-nowrap"
                  style={{ 
                    backgroundColor: expense.paidBy === 'partner1' 
                      ? 'var(--color-coral)' 
                      : 'var(--color-sage)',
                    color: expense.paidBy === 'partner1' ? 'white' : 'var(--color-plum)'
                  }}
                >
                  {paidByName} paid
                </span>
                
                <span className="font-mono text-xs text-[var(--color-plum)]/70 whitespace-nowrap">
                  {expense.splitType === 'equal' 
                    ? 'Split 50/50' 
                    : `${expense.partner1Share}/${expense.partner2Share}`}
                </span>
              </div>

              <p className="font-mono text-sm font-bold whitespace-nowrap">
                {otherPartnerName} owes {formatCurrency(amountOwed)}
              </p>
            </div>
          </div>

          {/* Note if present */}
          {expense.note && (
            <p 
              className="mt-3 text-sm italic text-[var(--color-plum)]/60 line-clamp-2"
              title={expense.note}
            >
              "{expense.note}"
            </p>
          )}

          {/* Actions */}
          {showActions && (
            <div className="mt-3 flex gap-2 justify-end">
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  ✏️ Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" onClick={onDelete}>
                  🗑️ Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

