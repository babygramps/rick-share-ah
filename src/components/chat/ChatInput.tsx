import { useState, type FormEvent } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  isThinking?: boolean;
}

export function ChatInput({ onSend, disabled, isThinking }: ChatInputProps) {
  const [value, setValue] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <div className="sticky bottom-0 bg-[var(--color-cream)] pt-3 pb-3 border-t-2 border-[var(--color-plum)]">
      {isThinking && (
        <p className="font-mono text-xs text-[var(--color-plum)]/60 mb-2 animate-pulse">
          🤖 AI job queued/running…
        </p>
      )}
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask about your spending…"
          disabled={disabled}
          className="input-brutal flex-1"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="btn-brutal disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
