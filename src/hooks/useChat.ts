import { useCallback, useEffect, useMemo, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { createChatThread, listChatJobs, listChatMessages, listChatThreads, queueChatMessage } from '../graphql/chatOperations';
import type { ChatJob, ChatMessage, ChatThread } from '../types/chat';

interface UseChatOptions {
  userId: string | null;
  groupId: string | null;
}

interface UseChatState {
  threads: ChatThread[];
  activeThread: ChatThread | null;
  messages: ChatMessage[];
  jobs: ChatJob[];
  activeJob: ChatJob | null;
  isLoading: boolean;
  isLoadingThreads: boolean;
  isThinking: boolean;
  startNewChat: () => void;
  selectThread: (threadId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  refreshActiveThread: (threadIdOverride?: string) => Promise<void>;
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
  const [jobs, setJobs] = useState<ChatJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);

  const client = useMemo(() => generateClient({ authMode: 'userPool' }), []);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [activeThreadId, threads]
  );

  const activeJob = useMemo(
    () => jobs.find((job) => job.status === 'queued' || job.status === 'running') ?? null,
    [jobs]
  );

  const isThinking = isQueueing || !!activeJob;

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

  const refreshActiveThread = useCallback(async (threadIdOverride?: string) => {
    const threadIdToLoad = threadIdOverride ?? activeThreadId;
    if (!userId || !groupId || !threadIdToLoad) {
      setMessages([]);
      setJobs([]);
      return;
    }

    setIsLoading(true);
    try {
      const collectedMessages: ChatMessage[] = [];
      let messageNextToken: string | null = null;
      do {
        const resp: any = await client.graphql({
          query: listChatMessages,
          variables: {
            threadId: threadIdToLoad,
            limit: 500,
            nextToken: messageNextToken,
          },
        });
        const items = resp?.data?.chatMessagesByThread?.items || [];
        collectedMessages.push(...items.filter((item: ChatMessage) => item.groupId === groupId));
        messageNextToken = resp?.data?.chatMessagesByThread?.nextToken ?? null;
      } while (messageNextToken);

      const collectedJobs: ChatJob[] = [];
      let jobNextToken: string | null = null;
      do {
        const resp: any = await client.graphql({
          query: listChatJobs,
          variables: {
            threadId: threadIdToLoad,
            limit: 25,
            nextToken: jobNextToken,
          },
        });
        const items = resp?.data?.chatJobsByThread?.items || [];
        collectedJobs.push(...items.filter((item: ChatJob) => item.groupId === groupId));
        jobNextToken = resp?.data?.chatJobsByThread?.nextToken ?? null;
      } while (jobNextToken);

      collectedMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      collectedJobs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setMessages(collectedMessages);
      setJobs(collectedJobs);
    } catch (err) {
      console.error('[chat] refresh.failed', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, groupId, activeThreadId, client]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await refreshActiveThread();
    })();
    return () => { cancelled = true; };
  }, [refreshActiveThread]);

  useEffect(() => {
    if (!activeJob) return;
    const interval = window.setInterval(() => {
      void refreshActiveThread();
    }, 4000);
    return () => window.clearInterval(interval);
  }, [activeJob, refreshActiveThread]);

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
    setJobs([]);
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
    setIsQueueing(true);

    try {
      const resp: any = await client.graphql({
        query: queueChatMessage,
        variables: { groupId, threadId: thread.id, content },
      });
      const job: ChatJob | undefined = resp?.data?.queueChatMessage;
      if (job) {
        setJobs((prev) => [job, ...prev.filter((item) => item.id !== job.id)]);
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
        content: "⚠️ Couldn't queue that message. Check your connection and try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, failureBubble]);
    } finally {
      setIsQueueing(false);
      void refreshActiveThread(thread.id);
    }
  }, [userId, groupId, activeThread, createThreadForMessage, client, refreshActiveThread]);

  return {
    threads,
    activeThread,
    messages,
    jobs,
    activeJob,
    isLoading,
    isLoadingThreads,
    isThinking,
    startNewChat,
    selectThread,
    sendMessage,
    refreshActiveThread,
  };
}
