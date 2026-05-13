export type ChatRole = 'user' | 'assistant';

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

export interface ChatThreadState {
  messages: ChatMessage[];
  isThinking: boolean;
  error: string | null;
}
