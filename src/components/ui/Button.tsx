import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
}

const variantClasses = {
  primary: 'bg-[var(--color-coral)] text-white hover:bg-[#ff5252]',
  secondary: 'bg-[var(--color-sage)] text-[var(--color-plum)] hover:bg-[#7bc9a0]',
  danger: 'bg-[var(--color-plum)] text-white hover:bg-[#4a2c3d]',
  ghost: 'bg-transparent text-[var(--color-plum)] shadow-none hover:bg-[var(--color-plum)]/10',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-4 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        btn-brutal
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || isLoading ? 'opacity-50 cursor-not-allowed transform-none shadow-none' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">◌</span>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

