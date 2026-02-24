import { create } from 'zustand';
import type { ChatMessage } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  voiceMode: boolean;
  isSpeaking: boolean;

  // Session state
  sessionId: string | null;
  isCreatingSession: boolean;
  sessionError: string | null;

  addMessage: (msg: ChatMessage) => void;
  appendToLastMessage: (chunk: string) => void;
  setStreaming: (v: boolean) => void;
  setVoiceMode: (v: boolean) => void;
  setSpeaking: (v: boolean) => void;
  clearMessages: () => void;

  // Session actions
  setSessionId: (sessionId: string | null) => void;
  setCreatingSession: (v: boolean) => void;
  setSessionError: (error: string | null) => void;
  resetSession: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  voiceMode: false,
  isSpeaking: false,
  sessionId: null,
  isCreatingSession: false,
  sessionError: null,

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  appendToLastMessage: (chunk) =>
    set((state) => {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last) {
        msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
      }
      return { messages: msgs };
    }),

  setStreaming: (v) => set({ isStreaming: v }),
  setVoiceMode: (v) => set({ voiceMode: v }),
  setSpeaking: (v) => set({ isSpeaking: v }),

  clearMessages: () => set({ messages: [] }),

  // Session actions
  setSessionId: (sessionId) => set({ sessionId, sessionError: null }),
  setCreatingSession: (v) => set({ isCreatingSession: v }),
  setSessionError: (error) => set({ sessionError: error, isCreatingSession: false }),
  resetSession: () => set({ sessionId: null, messages: [], sessionError: null }),
}));
