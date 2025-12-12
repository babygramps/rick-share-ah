import { Button } from '../ui/Button';
import type { ReceiptScanResult } from '../../hooks/useReceiptScan';
import type { ReceiptLineItemAssignment } from '../../types';
import { LineItemAssigner } from './LineItemAssigner';

export interface ScanApplySelection {
  description: boolean;
  amount: boolean;
  date: boolean;
  category: boolean;
}

interface ScanResultsProps {
  previewUrl: string;
  scan: ReceiptScanResult;
  selection: ScanApplySelection;
  onSelectionChange: (next: ScanApplySelection) => void;
  lineItemAssignments?: ReceiptLineItemAssignment[];
  onLineItemAssignmentsChange?: (next: ReceiptLineItemAssignment[]) => void;
  onApply: () => void;
  onRetry: () => void;
}

function moneyFromCents(cents?: number | null) {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return '—';
  return `$${(cents / 100).toFixed(2)}`;
}

export function ScanResults({
  previewUrl,
  scan,
  selection,
  onSelectionChange,
  lineItemAssignments,
  onLineItemAssignmentsChange,
  onApply,
  onRetry,
}: ScanResultsProps) {
  const confidencePct =
    typeof scan.confidence === 'number' && Number.isFinite(scan.confidence)
      ? Math.max(0, Math.min(1, scan.confidence)) * 100
      : 0;

  const lowConfidence = confidencePct > 0 && confidencePct < 70;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-[3px] border-[var(--color-plum)] bg-white shadow-[4px_4px_0px_var(--color-plum)] overflow-hidden">
          <img src={previewUrl} alt="Receipt preview" className="w-full max-h-[360px] object-contain bg-white" />
        </div>

        <div className="space-y-3">
          <div className="card-brutal p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-plum)]/70">
                Confidence
              </div>
              <div className={`font-mono text-xs ${lowConfidence ? 'text-[var(--color-coral)]' : 'text-[var(--color-plum)]'}`}>
                {confidencePct ? `${Math.round(confidencePct)}%` : '—'}
              </div>
            </div>
            <div className="mt-2 h-3 border-2 border-[var(--color-plum)] bg-white">
              <div
                className={`${lowConfidence ? 'bg-[var(--color-coral)]' : 'bg-[var(--color-sage)]'} h-full`}
                style={{ width: `${Math.round(confidencePct)}%` }}
              />
            </div>
            {lowConfidence && (
              <p className="mt-2 font-mono text-xs text-[var(--color-coral)]">
                Double-check these fields before applying.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between gap-3 border-[3px] border-[var(--color-plum)] bg-[var(--color-cream)] p-3 shadow-[2px_2px_0px_var(--color-plum)]">
              <span className="font-mono text-sm">
                🏪 {scan.merchantName || 'Merchant'}
              </span>
              <input
                type="checkbox"
                checked={selection.description}
                onChange={(e) => onSelectionChange({ ...selection, description: e.target.checked })}
              />
            </label>

            <label className="flex items-center justify-between gap-3 border-[3px] border-[var(--color-plum)] bg-[var(--color-cream)] p-3 shadow-[2px_2px_0px_var(--color-plum)]">
              <span className="font-mono text-sm">
                💵 {moneyFromCents(scan.totalAmount)}
              </span>
              <input
                type="checkbox"
                checked={selection.amount}
                onChange={(e) => onSelectionChange({ ...selection, amount: e.target.checked })}
              />
            </label>

            <label className="flex items-center justify-between gap-3 border-[3px] border-[var(--color-plum)] bg-[var(--color-cream)] p-3 shadow-[2px_2px_0px_var(--color-plum)]">
              <span className="font-mono text-sm">
                📅 {scan.date || 'Date'}
              </span>
              <input
                type="checkbox"
                checked={selection.date}
                onChange={(e) => onSelectionChange({ ...selection, date: e.target.checked })}
              />
            </label>

            <label className="flex items-center justify-between gap-3 border-[3px] border-[var(--color-plum)] bg-[var(--color-cream)] p-3 shadow-[2px_2px_0px_var(--color-plum)]">
              <span className="font-mono text-sm">
                🏷️ {scan.category || 'Category (we’ll guess)'}
              </span>
              <input
                type="checkbox"
                checked={selection.category}
                onChange={(e) => onSelectionChange({ ...selection, category: e.target.checked })}
              />
            </label>
          </div>

          {!!lineItemAssignments?.length && !!onLineItemAssignmentsChange && (
            <LineItemAssigner assignments={lineItemAssignments} onAssignmentsChange={onLineItemAssignmentsChange} />
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={onRetry}>
          🔄 Retry
        </Button>
        <Button type="button" className="flex-1" onClick={onApply} disabled={scan.status !== 'COMPLETED'}>
          ✅ Apply to Form
        </Button>
      </div>
    </div>
  );
}


