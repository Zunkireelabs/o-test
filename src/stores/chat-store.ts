import { create } from 'zustand';
import type { ChatMessage, ChatSession, ChatAction, ChatMessageType, ToolCallStatus, UIBlock } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  voiceMode: boolean;
  isSpeaking: boolean;

  // Session state
  sessionId: string | null;
  isCreatingSession: boolean;
  sessionError: string | null;

  // Session list state
  sessions: ChatSession[];
  sessionsLoading: boolean;
  sessionsError: string | null;

  // Rename state
  renamingSessionId: string | null;

  addMessage: (msg: ChatMessage) => void;
  appendToLastMessage: (chunk: string) => void;
  updateLastMessageMetadata: (metadata: {
    type?: ChatMessageType;
    actions?: ChatAction[];
    nextSuggestions?: string[];
  }) => void;
  addToolCallToLastMessage: (toolCall: ToolCallStatus) => void;
  updateToolCallInLastMessage: (toolCallId: string, updates: Partial<ToolCallStatus>) => void;
  addUIBlockToLastMessage: (uiBlock: UIBlock) => void;
  setStreaming: (v: boolean) => void;
  setVoiceMode: (v: boolean) => void;
  setSpeaking: (v: boolean) => void;
  clearMessages: () => void;
  setMessages: (messages: ChatMessage[]) => void;

  // Session actions
  setSessionId: (sessionId: string | null) => void;
  setCreatingSession: (v: boolean) => void;
  setSessionError: (error: string | null) => void;
  resetSession: () => void;

  // Session list actions
  loadSessions: (tenantId: string, projectId: string) => Promise<void>;
  loadSessionMessages: (sessionId: string) => Promise<void>;
  createNewSession: (tenantId: string, projectId: string) => Promise<string | null>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  addSessionToList: (session: ChatSession) => void;
  updateSessionInList: (sessionId: string, updates: Partial<ChatSession>) => void;

  // Rename actions
  setRenamingSessionId: (sessionId: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  voiceMode: false,
  isSpeaking: false,
  sessionId: null,
  isCreatingSession: false,
  sessionError: null,
  sessions: [],
  sessionsLoading: false,
  sessionsError: null,
  renamingSessionId: null,

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

  updateLastMessageMetadata: (metadata) =>
    set((state) => {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last) {
        msgs[msgs.length - 1] = {
          ...last,
          ...(metadata.type && { type: metadata.type }),
          ...(metadata.actions && { actions: metadata.actions }),
          ...(metadata.nextSuggestions && { nextSuggestions: metadata.nextSuggestions }),
        };
      }
      return { messages: msgs };
    }),

  addToolCallToLastMessage: (toolCall) =>
    set((state) => {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last) {
        const existingToolCalls = last.toolCalls || [];
        msgs[msgs.length - 1] = {
          ...last,
          toolCalls: [...existingToolCalls, toolCall],
        };
      }
      return { messages: msgs };
    }),

  updateToolCallInLastMessage: (toolCallId, updates) =>
    set((state) => {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.toolCalls) {
        msgs[msgs.length - 1] = {
          ...last,
          toolCalls: last.toolCalls.map((tc) =>
            tc.id === toolCallId ? { ...tc, ...updates } : tc
          ),
        };
      }
      return { messages: msgs };
    }),

  addUIBlockToLastMessage: (uiBlock) =>
    set((state) => {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last) {
        const existingBlocks = last.uiBlocks || [];
        msgs[msgs.length - 1] = {
          ...last,
          uiBlocks: [...existingBlocks, uiBlock],
        };
      }
      return { messages: msgs };
    }),

  setStreaming: (v) => set({ isStreaming: v }),
  setVoiceMode: (v) => set({ voiceMode: v }),
  setSpeaking: (v) => set({ isSpeaking: v }),

  clearMessages: () => set({ messages: [] }),
  setMessages: (messages) => set({ messages }),

  // Session actions
  setSessionId: (sessionId) => set({ sessionId, sessionError: null }),
  setCreatingSession: (v) => set({ isCreatingSession: v }),
  setSessionError: (error) => set({ sessionError: error, isCreatingSession: false }),
  resetSession: () => set({ sessionId: null, messages: [], sessionError: null }),

  // Session list actions
  loadSessions: async (tenantId: string, projectId: string) => {
    set({ sessionsLoading: true, sessionsError: null });

    try {
      const res = await fetch(
        `/api/chat/sessions?tenant_id=${tenantId}&project_id=${projectId}`,
        { credentials: 'include' }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load sessions');
      }

      const data = await res.json();
      set({ sessions: data.sessions || [], sessionsLoading: false });
    } catch (error) {
      console.error('Failed to load sessions:', error);
      set({
        sessionsError: error instanceof Error ? error.message : 'Failed to load sessions',
        sessionsLoading: false,
      });
    }
  },

  loadSessionMessages: async (sessionId: string) => {
    set({ sessionError: null });

    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load messages');
      }

      const data = await res.json();
      const messages: ChatMessage[] = (data.messages || []).map((m: {
        id: string;
        role: 'user' | 'assistant' | 'system';
        content: string;
      }) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      }));

      set({ messages, sessionId });
    } catch (error) {
      console.error('Failed to load session messages:', error);
      set({
        sessionError: error instanceof Error ? error.message : 'Failed to load messages',
      });
    }
  },

  createNewSession: async (tenantId: string, projectId: string) => {
    set({ isCreatingSession: true, sessionError: null });

    try {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tenant_id: tenantId,
          project_id: projectId,
          title: 'New Task',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create session');
      }

      const data = await res.json();
      const newSession = data.session as ChatSession;

      // Add to sessions list at the top
      set((state) => ({
        sessions: [newSession, ...state.sessions],
        sessionId: newSession.id,
        messages: [],
        isCreatingSession: false,
      }));

      // Persist to localStorage
      localStorage.setItem(`orca_session_${tenantId}_${projectId}`, newSession.id);

      return newSession.id;
    } catch (error) {
      console.error('Failed to create session:', error);
      set({
        sessionError: error instanceof Error ? error.message : 'Failed to create session',
        isCreatingSession: false,
      });
      return null;
    }
  },

  updateSessionTitle: async (sessionId: string, title: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        console.error('Failed to update session title');
        return;
      }

      // Update in local list
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, title, updated_at: new Date().toISOString() } : s
        ),
      }));
    } catch (error) {
      console.error('Failed to update session title:', error);
    }
  },

  addSessionToList: (session: ChatSession) => {
    set((state) => ({
      sessions: [session, ...state.sessions.filter((s) => s.id !== session.id)],
    }));
  },

  updateSessionInList: (sessionId: string, updates: Partial<ChatSession>) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    }));
  },

  deleteSession: async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        console.error('Failed to delete session');
        return false;
      }

      // Remove from local list and clear current if deleted
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
        ...(state.sessionId === sessionId && {
          sessionId: null,
          messages: [],
        }),
      }));

      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  },

  setRenamingSessionId: (sessionId) => set({ renamingSessionId: sessionId }),
}));
