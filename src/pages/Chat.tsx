import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useChat } from '../hooks/useChat';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { EmptyChat } from '../components/chat/EmptyChat';
import { AiDisclosureBanner } from '../components/chat/AiDisclosureBanner';

export function Chat() {
  const { user, group } = useApp();
  const { messages, isLoading, isThinking, sendMessage } = useChat({
    userId: user?.id ?? null,
    groupId: group?.id ?? null,
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isThinking]);

  return (
    <div className="flex flex-col min-h-[70vh] space-y-4">
      <h1 className="text-2xl font-bold">💬 Chat</h1>
      <AiDisclosureBanner />
      <div className="flex-1 space-y-3">
        {isLoading && (
          <p className="font-mono text-sm text-[var(--color-plum)]/60">Loading thread…</p>
        )}
        {!isLoading && messages.length === 0 && (
          <EmptyChat onPick={sendMessage} />
        )}
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        <div ref={scrollRef} />
      </div>
      <ChatInput onSend={sendMessage} isThinking={isThinking} disabled={isThinking || !group} />
    </div>
  );
}
