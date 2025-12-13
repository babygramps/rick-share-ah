import type { Settlement } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface SettlementCardProps {
  settlement: Settlement;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function SettlementCard({ settlement, onEdit, onDelete, showActions = true }: SettlementCardProps) {
  const { couple } = useApp();
  
  const paidByName = settlement.paidBy === 'partner1' 
    ? couple?.partner1Name 
    : couple?.partner2Name;
  const paidToName = settlement.paidTo === 'partner1' 
    ? couple?.partner1Name 
    : couple?.partner2Name;

  return (
    <Card hover className="relative overflow-hidden">
      {/* Settlement indicator stripe */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: 'var(--color-mint)' }}
      />
      
      <div className="flex items-start gap-3 pl-4">
        {/* Settlement icon */}
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border-2 border-black shadow-brutal-sm"
          style={{ backgroundColor: 'var(--color-mint)' }}
        >
          💸
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-base truncate">
                Settlement
              </h3>
              <p className="font-mono text-xs text-[var(--color-plum)]/60 mt-0.5">
                {paidByName} → {paidToName}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-mono font-bold text-lg text-[var(--color-mint)]">
                {formatCurrency(settlement.amount)}
              </p>
            </div>
          </div>
          
          {/* Date and note */}
          <div className="flex items-center justify-between mt-2 text-xs font-mono text-[var(--color-plum)]/50">
            <span>{formatDate(settlement.date)}</span>
            {settlement.note && (
              <span className="truncate max-w-[150px] ml-2" title={settlement.note}>
                {settlement.note}
              </span>
            )}
          </div>

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
