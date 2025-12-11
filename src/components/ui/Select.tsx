import type { SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
  emoji?: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-mono text-sm font-bold uppercase tracking-wider mb-2 text-[var(--color-plum)]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            input-brutal
            w-full
            px-4 py-3
            text-base
            appearance-none
            bg-white
            cursor-pointer
            bg-[url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="%235C374C" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>')]
            bg-no-repeat
            bg-[length:20px]
            bg-[right_12px_center]
            pr-10
            ${error ? 'border-[var(--color-coral)] bg-red-50' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.emoji ? `${option.emoji} ${option.label}` : option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm font-mono text-[var(--color-coral)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

