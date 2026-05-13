export type ChatRole = 'user' | 'assistant';
export type ChatJobStatus = 'queued' | 'running' | 'complete' | 'failed' | 'timed_out';

export interface ChatMessage {
  id: string;
  userId: string;
  groupId: string;
  threadId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatThread {
  id: string;
  userId: string;
  groupId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatJob {
  id: string;
  userId: string;
  groupId: string;
  threadId: string;
  userMessageId: string;
  assistantMessageId?: string | null;
  status: ChatJobStatus;
  statusText?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface ChatThreadState {
  messages: ChatMessage[];
  isThinking: boolean;
  error: string | null;
}
