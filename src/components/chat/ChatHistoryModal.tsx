import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { ChatThread } from '../../types/chat';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  threads: ChatThread[];
  activeThreadId?: string;
  isLoading?: boolean;
  onSelect: (threadId: string) => void;
}

function formatThreadDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ChatHistoryModal({
  isOpen,
  onClose,
  threads,
  activeThreadId,
  isLoading,
  onSelect,
}: ChatHistoryModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chat History" size="lg">
      <div className="space-y-3">
        {isLoading && (
          <p className="font-mono text-sm text-[var(--color-plum)]/60">Loading chats…</p>
        )}
        {!isLoading && threads.length === 0 && (
          <p className="font-mono text-sm text-[var(--color-plum)]/60">
            No saved chats yet. Start a new chat and it will show up here.
          </p>
        )}
        {threads.map((thread) => {
          const isActive = thread.id === activeThreadId;
          return (
            <button
              key={thread.id}
              type="button"
              onClick={() => {
                onSelect(thread.id);
                onClose();
              }}
              className={`
                w-full text-left border-2 border-[var(--color-plum)] p-3 transition-colors
                ${isActive ? 'bg-[var(--color-sunshine)]' : 'bg-white hover:bg-[var(--color-sage)]/30'}
              `}
              style={{ boxShadow: '3px 3px 0 var(--color-plum)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-bold">{thread.title || 'New chat'}</span>
                {isActive && <span className="font-mono text-xs">Current</span>}
              </div>
              <p className="font-mono text-xs text-[var(--color-plum)]/60 mt-1">
                Updated {formatThreadDate(thread.updatedAt)}
              </p>
            </button>
          );
        })}
        <div className="pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
