import { useCallback, useEffect, useMemo, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { createChatThread, listChatMessages, listChatThreads, sendChatMessage } from '../graphql/chatOperations';
import type { ChatMessage, ChatThread } from '../types/chat';

interface UseChatOptions {
  userId: string | null;
  groupId: string | null;
}

interface UseChatState {
  threads: ChatThread[];
  activeThread: ChatThread | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isLoadingThreads: boolean;
  isThinking: boolean;
  startNewChat: () => void;
  selectThread: (threadId: string) => void;
  sendMessage: (content: string) => Promise<void>;
}

function makeThreadTitle(content: string) {
  const cleaned = content.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'New chat';
  return cleaned.length > 48 ? `${cleaned.slice(0, 47)}…` : cleaned;
}

function sortThreads(threads: ChatThread[]) {
  return [...threads].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function useChat({ userId, groupId }: UseChatOptions): UseChatState {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const client = useMemo(() => generateClient({ authMode: 'userPool' }), []);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [activeThreadId, threads]
  );

  useEffect(() => {
    if (!userId || !groupId) return;
    let cancelled = false;
    (async () => {
      setIsLoadingThreads(true);
      try {
        const collected: ChatThread[] = [];
        let nextToken: string | null = null;
        do {
          const resp: any = await client.graphql({
            query: listChatThreads,
            variables: {
              filter: { groupId: { eq: groupId } },
              limit: 100,
              nextToken,
            },
          });
          const items = resp?.data?.listChatThreads?.items || [];
          collected.push(...items);
          nextToken = resp?.data?.listChatThreads?.nextToken ?? null;
        } while (nextToken);
        if (!cancelled) {
          const sorted = sortThreads(collected);
          setThreads(sorted);
          setActiveThreadId((current) => {
            if (current && sorted.some((thread) => thread.id === current)) return current;
            return sorted[0]?.id ?? null;
          });
        }
      } catch (err) {
        console.error('[chat] threads.load.failed', err);
      } finally {
        if (!cancelled) setIsLoadingThreads(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, groupId, client]);

  useEffect(() => {
    if (!userId || !groupId || !activeThreadId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const collected: ChatMessage[] = [];
        let nextToken: string | null = null;
        do {
          const resp: any = await client.graphql({
            query: listChatMessages,
            variables: {
              threadId: activeThreadId,
              limit: 500,
              nextToken,
            },
          });
          const items = resp?.data?.chatMessagesByThread?.items || [];
          collected.push(...items.filter((item: ChatMessage) => item.groupId === groupId));
          nextToken = resp?.data?.chatMessagesByThread?.nextToken ?? null;
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
  }, [userId, groupId, activeThreadId, client]);

  const createThreadForMessage = useCallback(async (content: string) => {
    if (!userId || !groupId) return null;
    const now = new Date().toISOString();
    const resp: any = await client.graphql({
      query: createChatThread,
      variables: {
        input: {
          userId,
          groupId,
          title: makeThreadTitle(content),
          createdAt: now,
          updatedAt: now,
        },
      },
    });
    const thread = resp?.data?.createChatThread as ChatThread | undefined;
    if (!thread) return null;
    setThreads((prev) => sortThreads([thread, ...prev.filter((item) => item.id !== thread.id)]));
    setActiveThreadId(thread.id);
    return thread;
  }, [userId, groupId, client]);

  const startNewChat = useCallback(() => {
    setActiveThreadId(null);
    setMessages([]);
  }, []);

  const selectThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!userId || !groupId) return;
    const thread = activeThread ?? await createThreadForMessage(content);
    if (!thread) return;

    const optimistic: ChatMessage = {
      id: `optimistic_${Date.now()}`,
      userId,
      groupId,
      threadId: thread.id,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setIsThinking(true);

    try {
      const resp: any = await client.graphql({
        query: sendChatMessage,
        variables: { groupId, threadId: thread.id, content },
      });
      const assistant: ChatMessage | undefined = resp?.data?.sendChatMessage;
      if (assistant) {
        setMessages((prev) => [...prev, assistant]);
      }
      const now = new Date().toISOString();
      setThreads((prev) => sortThreads(prev.map((item) => (
        item.id === thread.id
          ? { ...item, title: item.title === 'New chat' ? makeThreadTitle(content) : item.title, updatedAt: now }
          : item
      ))));
    } catch (err: any) {
      console.error('[chat] sendMessage.failed', err);
      const failureBubble: ChatMessage = {
        id: `err_${Date.now()}`,
        userId,
        groupId,
        threadId: thread.id,
        role: 'assistant',
        content: "⚠️ Send failed. Check your connection and try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, failureBubble]);
    } finally {
      setIsThinking(false);
    }
  }, [userId, groupId, activeThread, createThreadForMessage, client]);

  return {
    threads,
    activeThread,
    messages,
    isLoading,
    isLoadingThreads,
    isThinking,
    startNewChat,
    selectThread,
    sendMessage,
  };
}
