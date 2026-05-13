import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useChat } from '../hooks/useChat';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { EmptyChat } from '../components/chat/EmptyChat';
import { AiDisclosureBanner } from '../components/chat/AiDisclosureBanner';
import { ChatHistoryModal } from '../components/chat/ChatHistoryModal';
import { Button } from '../components/ui/Button';

export function Chat() {
  const { user, group } = useApp();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const {
    threads,
    activeThread,
    messages,
    isLoading,
    isLoadingThreads,
    isThinking,
    startNewChat,
    selectThread,
    sendMessage,
  } = useChat({
    userId: user?.id ?? null,
    groupId: group?.id ?? null,
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isThinking]);

  return (
    <div className="flex flex-col min-h-[70vh] space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">💬 Chat</h1>
          <p className="font-mono text-xs text-[var(--color-plum)]/60 mt-1">
            {activeThread ? activeThread.title : 'New chat'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={startNewChat}
            disabled={isThinking}
          >
            New Chat
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsHistoryOpen(true)}
            disabled={isThinking}
          >
            History
          </Button>
        </div>
      </div>
      <AiDisclosureBanner />
      <div className="flex-1 space-y-3">
        {(isLoading || isLoadingThreads) && (
          <p className="font-mono text-sm text-[var(--color-plum)]/60">Loading thread…</p>
        )}
        {!isLoading && !isLoadingThreads && messages.length === 0 && (
          <EmptyChat onPick={sendMessage} />
        )}
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        <div ref={scrollRef} />
      </div>
      <ChatInput onSend={sendMessage} isThinking={isThinking} disabled={isThinking || !group} />
      <ChatHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        threads={threads}
        activeThreadId={activeThread?.id}
        isLoading={isLoadingThreads}
        onSelect={selectThread}
      />
    </div>
  );
}
