import { useCallback, useEffect, useMemo, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { listChatMessages, sendChatMessage } from '../graphql/chatOperations';
import type { ChatMessage } from '../types/chat';

interface UseChatOptions {
  userId: string | null;
  groupId: string | null;
}

interface UseChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isThinking: boolean;
  sendMessage: (content: string) => Promise<void>;
}

export function useChat({ userId, groupId }: UseChatOptions): UseChatState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const client = useMemo(() => generateClient({ authMode: 'userPool' }), []);

  useEffect(() => {
    if (!userId || !groupId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        // listChatMessages is owner-auth-filtered to this user automatically.
        // We filter by groupId in code; per-user thread size is small enough
        // that paginating fully is fine.
        const collected: ChatMessage[] = [];
        let nextToken: string | null = null;
        do {
          const resp: any = await client.graphql({
            query: listChatMessages,
            variables: {
              filter: { groupId: { eq: groupId } },
              limit: 500,
              nextToken,
            },
          });
          const items = resp?.data?.listChatMessages?.items || [];
          collected.push(...items);
          nextToken = resp?.data?.listChatMessages?.nextToken ?? null;
        } while (nextToken);
        if (!cancelled) {
          collected.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          setMessages(collected);
        }
      } catch (err) {
        console.error('[chat] load.failed', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, groupId, client]);

  const sendMessage = useCallback(async (content: string) => {
    if (!userId || !groupId) return;

    const optimistic: ChatMessage = {
      id: `optimistic_${Date.now()}`,
      userId,
      groupId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setIsThinking(true);

    try {
      const resp: any = await client.graphql({
        query: sendChatMessage,
        variables: { groupId, content },
      });
      const assistant: ChatMessage | undefined = resp?.data?.sendChatMessage;
      if (assistant) {
        setMessages((prev) => [...prev, assistant]);
      }
    } catch (err: any) {
      console.error('[chat] sendMessage.failed', err);
      const failureBubble: ChatMessage = {
        id: `err_${Date.now()}`,
        userId,
        groupId,
        role: 'assistant',
        content: "⚠️ Send failed. Check your connection and try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, failureBubble]);
    } finally {
      setIsThinking(false);
    }
  }, [userId, groupId, client]);

  return { messages, isLoading, isThinking, sendMessage };
}
