import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Card, CardHeader, CardTitle } from './Card';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-plum)]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <Card
        className={`
          relative
          w-full
          ${sizeClasses[size]}
          animate-bounce-in
          max-h-[90vh]
          overflow-auto
        `}
        padding="none"
      >
        {title && (
          <CardHeader className="flex items-center justify-between p-5 mb-0">
            <CardTitle>{title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-2xl leading-none p-1"
            >
              ✕
            </Button>
          </CardHeader>
        )}
        <div className="p-5">
          {children}
        </div>
      </Card>
    </div>
  );
}

