import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-mono text-sm font-bold uppercase tracking-wider mb-2 text-[var(--color-plum)]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`
              input-brutal
              w-full
              px-4 py-3
              text-base
              ${icon ? 'pl-12' : ''}
              ${error ? 'border-[var(--color-coral)] bg-red-50' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm font-mono text-[var(--color-coral)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-mono text-sm font-bold uppercase tracking-wider mb-2 text-[var(--color-plum)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            input-brutal
            w-full
            px-4 py-3
            text-base
            min-h-[100px]
            resize-none
            ${error ? 'border-[var(--color-coral)] bg-red-50' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm font-mono text-[var(--color-coral)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

