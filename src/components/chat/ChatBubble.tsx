import type { ChatMessage } from '../../types/chat';

interface ChatBubbleProps {
  message: ChatMessage;
  onRetry?: () => void;
}

export function ChatBubble({ message, onRetry }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isErrorBubble = !isUser && message.content.startsWith('⚠️');

  const containerAlign = isUser ? 'justify-end' : 'justify-start';
  const bubbleBg = isUser
    ? 'bg-[var(--color-sunshine)] text-[var(--color-plum)]'
    : isErrorBubble
      ? 'bg-[var(--color-coral)]/20 text-[var(--color-plum)]'
      : 'bg-white text-[var(--color-plum)]';

  return (
    <div className={`flex ${containerAlign} animate-slide-up`}>
      <div
        className={`max-w-[85%] border-2 border-[var(--color-plum)] p-3 font-mono text-sm whitespace-pre-wrap ${bubbleBg}`}
        style={{ boxShadow: '3px 3px 0 var(--color-plum)' }}
      >
        {message.content}
        {isErrorBubble && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="block mt-2 underline text-xs uppercase tracking-wider"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
