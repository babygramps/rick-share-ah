import { useMemo } from 'react';
import { Input } from './Input';

export type DateRangePreset = '30' | '90' | '365' | 'all' | 'custom';

export interface DateRangeValue {
  preset: DateRangePreset;
  from?: string; // yyyy-mm-dd
  to?: string; // yyyy-mm-dd
}

export interface DateRangeMs {
  startMs?: number;
  endMs?: number;
  isActive: boolean;
  label: string;
}

function startOfDayLocalMs(yyyyMmDd: string): number {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0).getTime();
}

function endOfDayLocalMs(yyyyMmDd: string): number {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999).getTime();
}

function formatYyyyMmDd(yyyyMmDd?: string): string {
  if (!yyyyMmDd) return '';
  // Keep it consistent with <input type="date"> values.
  return yyyyMmDd;
}

export function getDateRangeMs(
  value: DateRangeValue,
  now: Date = new Date()
): DateRangeMs {
  const nowMs = now.getTime();

  if (value.preset === 'all') {
    return { isActive: false, label: 'All time' };
  }

  if (value.preset === '30' || value.preset === '90' || value.preset === '365') {
    const days = parseInt(value.preset, 10);
    const startMs = nowMs - days * 24 * 60 * 60 * 1000;
    const label = value.preset === '365' ? 'Last 1 year' : `Last ${days} days`;
    return { startMs, endMs: nowMs, isActive: true, label };
  }

  // Custom
  const rawStart = value.from ? startOfDayLocalMs(value.from) : undefined;
  const rawEnd = value.to ? endOfDayLocalMs(value.to) : undefined;

  let startMs = rawStart;
  let endMs = rawEnd;
  if (typeof startMs === 'number' && typeof endMs === 'number' && startMs > endMs) {
    // If user picks reversed bounds, auto-correct.
    [startMs, endMs] = [endMs, startMs];
  }

  const isActive = typeof startMs === 'number' || typeof endMs === 'number';
  const label = isActive
    ? `${formatYyyyMmDd(value.from) || '…'} → ${formatYyyyMmDd(value.to) || '…'}`
    : 'Custom';

  return { startMs, endMs, isActive, label };
}

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  className?: string;
  showClear?: boolean;
}

export function DateRangeFilter({
  value,
  onChange,
  className = '',
  showClear = true,
}: DateRangeFilterProps) {
  const derived = useMemo(() => getDateRangeMs(value), [value]);

  const options: Array<{ value: DateRangePreset; label: string }> = [
    { value: '30', label: '30D' },
    { value: '90', label: '90D' },
    { value: '365', label: '1Y' },
    { value: 'all', label: 'All' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 bg-white border-3 border-[var(--color-plum)] p-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onChange(
                  option.value === 'custom'
                    ? { preset: 'custom', from: value.from, to: value.to }
                    : { preset: option.value }
                )
              }
              className={`
                px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors
                ${value.preset === option.value
                  ? 'bg-[var(--color-plum)] text-white'
                  : 'hover:bg-[var(--color-cream)]'
                }
              `}
              aria-pressed={value.preset === option.value}
              title={option.label}
            >
              {option.label}
            </button>
          ))}
        </div>

        {showClear && derived.isActive && (
          <button
            type="button"
            onClick={() => onChange({ preset: 'all' })}
            className="text-xs font-mono text-[var(--color-plum)]/70 hover:text-[var(--color-coral)] underline"
            title="Clear date filter"
          >
            Clear
          </button>
        )}
      </div>

      {value.preset === 'custom' && (
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="From"
            value={value.from || ''}
            onChange={(e) => onChange({ ...value, preset: 'custom', from: e.target.value || undefined })}
          />
          <Input
            type="date"
            label="To"
            value={value.to || ''}
            onChange={(e) => onChange({ ...value, preset: 'custom', to: e.target.value || undefined })}
          />
        </div>
      )}
    </div>
  );
}

