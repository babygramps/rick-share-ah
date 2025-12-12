import { useMemo } from 'react';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import type { ReceiptLineItemAssignment, LineItemAssignTo } from '../../types';

function moneyFromCents(cents?: number | null) {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return '—';
  return `$${(cents / 100).toFixed(2)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeTotals(assignments: ReceiptLineItemAssignment[]) {
  let partner1Cents = 0;
  let partner2Cents = 0;
  let basisCents = 0;

  for (const a of assignments) {
    const price = typeof a.price === 'number' && Number.isFinite(a.price) ? Math.round(a.price) : 0;
    if (price <= 0) continue;
    basisCents += price;

    const assignTo: LineItemAssignTo = a.assignTo;
    let p1Pct = 50;
    if (assignTo === 'partner1') p1Pct = 100;
    if (assignTo === 'partner2') p1Pct = 0;
    if (assignTo === 'split') p1Pct = 50;
    if (assignTo === 'custom') p1Pct = clamp(Number(a.customPercent ?? 50), 0, 100);

    const p1 = Math.round((price * p1Pct) / 100);
    const p2 = price - p1;
    partner1Cents += p1;
    partner2Cents += p2;
  }

  const total = partner1Cents + partner2Cents;
  const partner1Pct = total > 0 ? Math.round((partner1Cents / total) * 100) : 50;
  const partner2Pct = 100 - partner1Pct;

  return { partner1Cents, partner2Cents, basisCents, partner1Pct, partner2Pct };
}

interface LineItemAssignerProps {
  assignments: ReceiptLineItemAssignment[];
  onAssignmentsChange: (next: ReceiptLineItemAssignment[]) => void;
}

export function LineItemAssigner({ assignments, onAssignmentsChange }: LineItemAssignerProps) {
  const { couple } = useApp();
  const p1Label = couple?.partner1Name || 'Partner 1';
  const p2Label = couple?.partner2Name || 'Partner 2';

  const totals = useMemo(() => computeTotals(assignments), [assignments]);

  const setAll = (assignTo: LineItemAssignTo) => {
    console.log('[receipt-scan] lineItems.setAll', { assignTo, count: assignments.length });
    onAssignmentsChange(
      assignments.map((a) => ({
        ...a,
        assignTo,
        customPercent: assignTo === 'custom' ? a.customPercent ?? 50 : undefined,
      }))
    );
  };

  const update = (id: string, patch: Partial<ReceiptLineItemAssignment>) => {
    onAssignmentsChange(assignments.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  if (!assignments.length) return null;

  return (
    <div className="card-brutal p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-plum)]/70">Line items</div>
          <div className="text-sm text-[var(--color-plum)]">
            Tap to assign each item. We’ll convert this into a clean split for the expense.
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xs text-[var(--color-plum)]/70">Split</div>
          <div className="font-mono text-sm">
            {totals.partner1Pct}% / {totals.partner2Pct}%
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setAll('partner1')}>
          {p1Label}: all
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setAll('partner2')}>
          {p2Label}: all
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setAll('split')}>
          Split all
        </Button>
      </div>

      <div className="max-h-[260px] overflow-auto space-y-2 pr-1">
        {assignments.map((a) => {
          const priceOk = typeof a.price === 'number' && Number.isFinite(a.price) && a.price > 0;
          const desc = (a.description || '').trim() || 'Item';
          const qty = typeof a.quantity === 'number' && Number.isFinite(a.quantity) && a.quantity > 1 ? a.quantity : null;

          const pillBase =
            'border-2 border-[var(--color-plum)] px-2 py-1 font-mono text-xs shadow-[2px_2px_0px_var(--color-plum)]';
          const pill = (active: boolean, bg: string) =>
            `${pillBase} ${active ? bg : 'bg-white'} ${priceOk ? '' : 'opacity-50 cursor-not-allowed'}`;

          return (
            <div
              key={a.id}
              className="border-[3px] border-[var(--color-plum)] bg-[var(--color-cream)] p-3 shadow-[2px_2px_0px_var(--color-plum)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-sm truncate">
                    {desc} {qty ? <span className="text-[var(--color-plum)]/60">×{qty}</span> : null}
                  </div>
                  <div className="font-mono text-xs text-[var(--color-plum)]/60">{priceOk ? 'Tap assignment' : 'No price found'}</div>
                </div>
                <div className="font-mono text-sm">{moneyFromCents(a.price ?? null)}</div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  disabled={!priceOk}
                  className={pill(a.assignTo === 'partner1', 'bg-[var(--color-coral)] text-white')}
                  onClick={() => update(a.id, { assignTo: 'partner1', customPercent: undefined })}
                >
                  {p1Label}
                </button>
                <button
                  type="button"
                  disabled={!priceOk}
                  className={pill(a.assignTo === 'partner2', 'bg-[var(--color-sage)] text-[var(--color-plum)]')}
                  onClick={() => update(a.id, { assignTo: 'partner2', customPercent: undefined })}
                >
                  {p2Label}
                </button>
                <button
                  type="button"
                  disabled={!priceOk}
                  className={pill(a.assignTo === 'split', 'bg-[var(--color-lavender)] text-[var(--color-plum)]')}
                  onClick={() => update(a.id, { assignTo: 'split', customPercent: undefined })}
                >
                  50/50
                </button>
                <button
                  type="button"
                  disabled={!priceOk}
                  className={pill(a.assignTo === 'custom', 'bg-[var(--color-sunshine)] text-[var(--color-plum)]')}
                  onClick={() => update(a.id, { assignTo: 'custom', customPercent: a.customPercent ?? 50 })}
                >
                  Custom
                </button>

                {a.assignTo === 'custom' && priceOk && (
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={clamp(Number(a.customPercent ?? 50), 0, 100)}
                      onChange={(e) => update(a.id, { customPercent: clamp(Number(e.target.value), 0, 100) })}
                    />
                    <input
                      type="number"
                      className="input-brutal w-[76px] px-2 py-1 text-xs"
                      min={0}
                      max={100}
                      value={clamp(Number(a.customPercent ?? 50), 0, 100)}
                      onChange={(e) => update(a.id, { customPercent: clamp(Number(e.target.value), 0, 100) })}
                    />
                    <span className="font-mono text-xs text-[var(--color-plum)]/70">% {p1Label}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t-2 border-[var(--color-plum)] pt-3 flex items-center justify-between gap-3">
        <div className="font-mono text-xs text-[var(--color-plum)]/70">Assigned subtotal (items with prices)</div>
        <div className="font-mono text-sm">{moneyFromCents(totals.basisCents)}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="border-2 border-[var(--color-plum)] bg-white p-2 shadow-[2px_2px_0px_var(--color-plum)]">
          <div className="font-mono text-xs text-[var(--color-plum)]/70">{p1Label}</div>
          <div className="font-mono text-sm">{moneyFromCents(totals.partner1Cents)}</div>
        </div>
        <div className="border-2 border-[var(--color-plum)] bg-white p-2 shadow-[2px_2px_0px_var(--color-plum)]">
          <div className="font-mono text-xs text-[var(--color-plum)]/70">{p2Label}</div>
          <div className="font-mono text-sm">{moneyFromCents(totals.partner2Cents)}</div>
        </div>
      </div>
    </div>
  );
}

export function computeLineItemSplitPercent(assignments: ReceiptLineItemAssignment[]) {
  const totals = computeTotals(assignments);
  return { partner1Pct: totals.partner1Pct, partner2Pct: totals.partner2Pct, basisCents: totals.basisCents };
}


