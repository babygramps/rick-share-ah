import type { Expense } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate, getCategoryInfo } from '../../utils/helpers';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function ExpenseCard({ expense, onEdit, onDelete, showActions = true }: ExpenseCardProps) {
  const { members, user } = useApp();
  const categoryInfo = getCategoryInfo(expense.category);

  // Resolve Payer
  const payer = members.find(m => m.userId === expense.paidBy);
  const paidByName = payer?.name || 'Unknown';
  const isPayer = user?.id === expense.paidBy;

  // Calculate my share/impact
  let myShare = 0;
  let isInvolved = false;

  if (expense.shares) {
    try {
      const shares = JSON.parse(expense.shares); // Record<userId, number> (cents)
      if (shares[user?.id || '']) {
        myShare = shares[user?.id || ''];
        isInvolved = true;
      }
    } catch (e) { console.error(e) }
  } else {
    // Legacy fallback (assume 50/50 if not specified, or parse legacy fields if critical)
    // For now, if no shares JSON, we might assume equal split or legacy Couple logic
    // But simpler to just start fresh for Group mode.
    // If we really need legacy support, we'd check partner1Share/partner2Share
  }

  const amountImpact = isPayer ? (expense.amount - myShare) : myShare; // If I paid, I get back (Amount - MyShare). If I didn't pay, I owe MyShare.

  // Text to display
  let statusText = '';
  let statusColor = 'var(--color-plum)';

  if (isPayer) {
    statusText = `you lent ${formatCurrency(amountImpact)}`;
    statusColor = 'var(--color-sage)';
  } else if (isInvolved) {
    statusText = `you owe ${formatCurrency(myShare)}`;
    statusColor = 'var(--color-coral)';
  } else {
    statusText = 'not involved';
    statusColor = 'var(--color-plum)';
  }

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

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left side - expense info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{categoryInfo.emoji}</span>
                <h3 className="font-bold text-lg truncate">
                  {expense.description}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-[var(--color-plum)]/70">
                <span>{formatDate(expense.date)}</span>
                <span className="bg-[var(--color-cream)] px-2 py-0.5 border border-[var(--color-plum)]/20">
                  {categoryInfo.label}
                </span>
                <span>
                  {paidByName} paid {formatCurrency(expense.amount)}
                </span>
              </div>
            </div>

            {/* Right side - User impact */}
            {isInvolved && (
              <div className="text-right flex-shrink-0">
                <p className="font-mono text-xs uppercase font-bold" style={{ color: statusColor }}>
                  {statusText}
                </p>
              </div>
            )}
          </div>

          {/* Note if present */}
          {expense.note && (
            <p className="mt-2 text-sm italic text-[var(--color-plum)]/60">
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
