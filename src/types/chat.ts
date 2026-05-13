export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  userId: string;
  groupId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatThreadState {
  messages: ChatMessage[];
  isThinking: boolean;
  error: string | null;
}
