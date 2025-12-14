import { useState } from 'react';
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

// Editable overrides for scan values
export interface ScanOverrides {
  merchantName?: string;
  totalAmount?: number | null; // in cents
  date?: string;
}

interface ScanResultsProps {
  previewUrl: string;
  scan: ReceiptScanResult;
  selection: ScanApplySelection;
  onSelectionChange: (next: ScanApplySelection) => void;
  overrides?: ScanOverrides;
  onOverridesChange?: (next: ScanOverrides) => void;
  lineItemAssignments?: ReceiptLineItemAssignment[];
  onLineItemAssignmentsChange?: (next: ReceiptLineItemAssignment[]) => void;
  onApply: () => void;
  onRetry: () => void;
}

function moneyFromCents(cents?: number | null) {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return '—';
  return `$${(cents / 100).toFixed(2)}`;
}

function centsFromInput(value: string): number | null {
  const cleaned = value.replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100);
}

export function ScanResults({
  previewUrl,
  scan,
  selection,
  onSelectionChange,
  overrides = {},
  onOverridesChange,
  lineItemAssignments,
  onLineItemAssignmentsChange,
  onApply,
  onRetry,
}: ScanResultsProps) {
  // Track which field is being edited
  const [editingField, setEditingField] = useState<'merchant' | 'amount' | 'date' | null>(null);
  
  // Get effective values (overrides take precedence)
  const effectiveMerchant = overrides.merchantName ?? scan.merchantName ?? '';
  const effectiveAmount = overrides.totalAmount !== undefined ? overrides.totalAmount : scan.totalAmount ?? null;
  const effectiveDate = overrides.date ?? scan.date ?? '';
  
  const confidencePct =
    typeof scan.confidence === 'number' && Number.isFinite(scan.confidence)
      ? Math.max(0, Math.min(1, scan.confidence)) * 100
      : 0;

  const lowConfidence = confidencePct > 0 && confidencePct < 70;
  
  // Check if any values have been edited
  const hasEdits = overrides.merchantName !== undefined || 
                   overrides.totalAmount !== undefined || 
                   overrides.date !== undefined;

  const handleOverride = (key: keyof ScanOverrides, value: string | number | null | undefined) => {
    if (onOverridesChange) {
      onOverridesChange({ ...overrides, [key]: value });
    }
  };

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
            {hasEdits && (
              <p className="mt-2 font-mono text-xs text-[var(--color-sage)]">
                ✏️ Values edited
              </p>
            )}
          </div>

          <div className="space-y-2">
            {/* Merchant Name - Editable */}
            <div className="flex items-center gap-2 border-[3px] border-[var(--color-plum)] bg-[var(--color-cream)] p-3 shadow-[2px_2px_0px_var(--color-plum)]">
              {editingField === 'merchant' ? (
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-lg">🏪</span>
                  <input
                    type="text"
                    autoFocus
                    className="flex-1 bg-white border-2 border-[var(--color-plum)] px-2 py-1 font-mono text-sm"
                    defaultValue={effectiveMerchant}
                    onBlur={(e) => {
                      handleOverride('merchantName', e.target.value || undefined);
                      setEditingField(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleOverride('merchantName', e.currentTarget.value || undefined);
                        setEditingField(null);
                      } else if (e.key === 'Escape') {
                        setEditingField(null);
                      }
                    }}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="flex-1 text-left font-mono text-sm hover:text-[var(--color-coral)] transition-colors"
                  onClick={() => setEditingField('merchant')}
                  title="Click to edit"
                >
                  🏪 {effectiveMerchant || 'Merchant'} 
                  {overrides.merchantName !== undefined && <span className="text-[var(--color-sage)] ml-1">✏️</span>}
                </button>
              )}
              <input
                type="checkbox"
                checked={selection.description}
                onChange={(e) => onSelectionChange({ ...selection, description: e.target.checked })}
              />
            </div>

            {/* Amount - Editable */}
            <div className="flex items-center gap-2 border-[3px] border-[var(--color-plum)] bg-[var(--color-cream)] p-3 shadow-[2px_2px_0px_var(--color-plum)]">
              {editingField === 'amount' ? (
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-lg">💵</span>
                  <span className="font-mono text-sm">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    className="flex-1 bg-white border-2 border-[var(--color-plum)] px-2 py-1 font-mono text-sm"
                    defaultValue={effectiveAmount !== null ? (effectiveAmount / 100).toFixed(2) : ''}
                    placeholder="0.00"
                    onBlur={(e) => {
                      const cents = centsFromInput(e.target.value);
                      handleOverride('totalAmount', cents);
                      setEditingField(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const cents = centsFromInput(e.currentTarget.value);
                        handleOverride('totalAmount', cents);
                        setEditingField(null);
                      } else if (e.key === 'Escape') {
                        setEditingField(null);
                      }
                    }}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="flex-1 text-left font-mono text-sm hover:text-[var(--color-coral)] transition-colors"
                  onClick={() => setEditingField('amount')}
                  title="Click to edit"
                >
                  💵 {moneyFromCents(effectiveAmount)}
                  {overrides.totalAmount !== undefined && <span className="text-[var(--color-sage)] ml-1">✏️</span>}
                </button>
              )}
              <input
                type="checkbox"
                checked={selection.amount}
                onChange={(e) => onSelectionChange({ ...selection, amount: e.target.checked })}
              />
            </div>

            {/* Date - Editable */}
            <div className="flex items-center gap-2 border-[3px] border-[var(--color-plum)] bg-[var(--color-cream)] p-3 shadow-[2px_2px_0px_var(--color-plum)]">
              {editingField === 'date' ? (
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  <input
                    type="date"
                    autoFocus
                    className="flex-1 bg-white border-2 border-[var(--color-plum)] px-2 py-1 font-mono text-sm"
                    defaultValue={effectiveDate}
                    onBlur={(e) => {
                      handleOverride('date', e.target.value || undefined);
                      setEditingField(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleOverride('date', e.currentTarget.value || undefined);
                        setEditingField(null);
                      } else if (e.key === 'Escape') {
                        setEditingField(null);
                      }
                    }}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="flex-1 text-left font-mono text-sm hover:text-[var(--color-coral)] transition-colors"
                  onClick={() => setEditingField('date')}
                  title="Click to edit"
                >
                  📅 {effectiveDate || 'Date'}
                  {overrides.date !== undefined && <span className="text-[var(--color-sage)] ml-1">✏️</span>}
                </button>
              )}
              <input
                type="checkbox"
                checked={selection.date}
                onChange={(e) => onSelectionChange({ ...selection, date: e.target.checked })}
              />
            </div>

            {/* Category - Read-only (auto-guessed) */}
            <label className="flex items-center justify-between gap-3 border-[3px] border-[var(--color-plum)] bg-[var(--color-cream)] p-3 shadow-[2px_2px_0px_var(--color-plum)]">
              <span className="font-mono text-sm">
                🏷️ {scan.category || "Category (we'll guess)"}
              </span>
              <input
                type="checkbox"
                checked={selection.category}
                onChange={(e) => onSelectionChange({ ...selection, category: e.target.checked })}
              />
            </label>
          </div>
          
          <p className="font-mono text-xs text-[var(--color-plum)]/50 text-center">
            💡 Click any value to edit it
          </p>

          {!!lineItemAssignments?.length && !!onLineItemAssignmentsChange && (
            <LineItemAssigner 
              assignments={lineItemAssignments} 
              onAssignmentsChange={onLineItemAssignmentsChange}
              totalAmountCents={effectiveAmount}
            />
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
