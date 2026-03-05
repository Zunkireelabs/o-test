'use client';

import { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useChatStore } from '@/stores/chat-store';
import { useTTS } from '@/hooks/use-tts';
import { ChatMessages } from '@/components/features/chat-messages';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Wrench,
  ArrowUp,
  Mic,
  MicOff,
  AudioLines,
  AlertCircle,
} from 'lucide-react';
import { ChatSuggestions, DEFAULT_SUGGESTIONS } from '@/components/features/chat-suggestions';
import type { ChatAction } from '@/types';
import { motion } from 'framer-motion';


export function NewTaskSection() {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const voiceTranscriptRef = useRef('');
  const autoSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doSubmitRef = useRef<((text: string) => Promise<void>) | undefined>(undefined);
  const { tenantId, projectId, sidebarCollapsed } = useAppStore();

  // Detect mobile viewport for responsive fixed positioning
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const {
    messages, isStreaming, voiceMode,
    sessionId, isCreatingSession, sessionError,
    addMessage, appendToLastMessage, updateLastMessageMetadata,
    addToolCallToLastMessage, updateToolCallInLastMessage,
    addUIBlockToLastMessage,
    setStreaming, setVoiceMode,
    setSessionError,
    createNewSession, updateSessionTitle,
  } = useChatStore();
  const { speak, stop: stopTTS } = useTTS();

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
    };
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    voiceTranscriptRef.current = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      voiceTranscriptRef.current = transcript;
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;

      // In voice mode, auto-submit after a short delay for final transcript
      if (useChatStore.getState().voiceMode && voiceTranscriptRef.current.trim()) {
        autoSubmitTimerRef.current = setTimeout(() => {
          autoSubmitTimerRef.current = null;
          doSubmitRef.current?.(voiceTranscriptRef.current.trim());
        }, 300);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const toggleVoiceMode = useCallback(() => {
    const next = !voiceMode;
    setVoiceMode(next);
    if (!next) {
      // Turning off: stop everything
      stopTTS();
      stopListening();
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
        autoSubmitTimerRef.current = null;
      }
    } else {
      // Turning on: start listening immediately
      startListening();
    }
  }, [voiceMode, setVoiceMode, stopTTS, stopListening, startListening]);

  // Handle guided prompt suggestion clicks (populate input, don't auto-send)
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setInput(suggestion);
  }, []);

  // Handle action button clicks from assistant messages
  const handleActionSelect = useCallback((action: ChatAction) => {
    // Convert action to a natural language message
    const actionMessages: Record<ChatAction['type'], string> = {
      assign_lead: 'Assign owner to the lead',
      move_stage: 'Move the lead to another stage',
      send_email: 'Send follow-up email',
      view_pipeline: 'Show my pipeline',
      create_lead: 'Create a new lead',
      update_lead: 'Update the lead',
      custom: action.label,
    };

    const message = actionMessages[action.type] || action.label;
    // Auto-submit the action using the ref (avoids circular dependency)
    doSubmitRef.current?.(message);
  }, []);

  // Track if this is the first message in a session (for title update)
  const isFirstMessageRef = useRef(true);

  // Reset first message flag when sessionId changes
  useEffect(() => {
    isFirstMessageRef.current = messages.length === 0;
  }, [sessionId, messages.length]);

  // Core submit logic shared by manual and voice-triggered submission
  const doSubmit = useCallback(async (text: string) => {
    if (!text || isStreaming || isCreatingSession) return;

    // Validate tenant and project context
    if (!tenantId || !projectId) {
      setSessionError('Missing tenant or project context. Please refresh the page.');
      return;
    }

    // Stop TTS if currently speaking
    stopTTS();

    // Stop voice if active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    setInput('');

    // Get or create session
    let currentSessionId = sessionId;
    const isNewSession = !currentSessionId;
    if (!currentSessionId) {
      currentSessionId = await createNewSession(tenantId, projectId);
      if (!currentSessionId) {
        // Session creation failed, error already set
        return;
      }
    }

    // Update session title on first message (truncate to 50 chars)
    if (isNewSession || isFirstMessageRef.current) {
      const title = text.length > 50 ? text.substring(0, 47) + '...' : text;
      updateSessionTitle(currentSessionId, title);
      isFirstMessageRef.current = false;
    }

    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: text };
    addMessage(userMsg);

    const assistantMsg = { id: crypto.randomUUID(), role: 'assistant' as const, content: '' };
    addMessage(assistantMsg);
    setStreaming(true);

    let responseText = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: text,
          tenant_id: tenantId,
          project_id: projectId,
          session_id: currentSessionId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const events = buffer.split('\n\n');
        // Keep incomplete event in buffer
        buffer = events.pop() || '';

        for (const eventBlock of events) {
          if (!eventBlock.trim()) continue;

          const lines = eventBlock.split('\n');
          let eventType = '';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7);
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6);
            }
          }

          if (!eventType || !eventData) continue;

          try {
            const data = JSON.parse(eventData);

            switch (eventType) {
              case 'text':
                if (data.content) {
                  responseText += data.content;
                  appendToLastMessage(data.content);
                }
                break;

              case 'tool_start':
                // Add new tool call to message
                addToolCallToLastMessage({
                  id: data.id,
                  name: data.name,
                  displayName: data.displayName,
                  status: 'running',
                });
                break;

              case 'tool_complete':
                // Update tool call status
                updateToolCallInLastMessage(data.id, {
                  status: data.status,
                  summary: data.summary,
                });
                break;

              case 'ui_block':
                // Add UI block to message
                if (data.block) {
                  addUIBlockToLastMessage(data.block);
                }
                break;

              case 'metadata':
                // Update last message with actions/suggestions
                updateLastMessageMetadata({
                  type: data.messageType,
                  actions: data.actions,
                  nextSuggestions: data.nextSuggestions,
                });
                break;

              case 'done':
                // Stream complete
                break;
            }
          } catch {
            // Failed to parse event data, skip
            console.warn('Failed to parse SSE event:', eventBlock);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errMsg = error instanceof Error ? `\n\nError: ${error.message}` : '\n\nAn error occurred.';
      appendToLastMessage(errMsg);
      responseText += errMsg;
    } finally {
      setStreaming(false);
    }

    // Voice mode: speak the response, then auto-listen
    if (useChatStore.getState().voiceMode && responseText.trim()) {
      try {
        await speak(responseText);
      } catch {
        // TTS failed silently, continue loop
      }
      // After TTS finishes, auto-start listening if still in voice mode
      if (useChatStore.getState().voiceMode) {
        startListening();
      }
    }
  }, [isStreaming, isCreatingSession, isListening, tenantId, projectId, sessionId, createNewSession, updateSessionTitle, addMessage, appendToLastMessage, updateLastMessageMetadata, addToolCallToLastMessage, updateToolCallInLastMessage, addUIBlockToLastMessage, setStreaming, stopTTS, speak, startListening, setSessionError]);

  // Keep ref in sync so startListening's onend can call it without a circular dep
  doSubmitRef.current = doSubmit;

  const handleSubmit = useCallback(async () => {
    await doSubmit(input.trim());
  }, [input, doSubmit]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasMessages = messages.length > 0;

  // Shared input component
  const inputArea = (
    <div className={`relative bg-card dark:bg-zinc-800/80 rounded-2xl border shadow-sm overflow-hidden ${voiceMode ? 'border-violet-300 dark:border-violet-500/60' : 'border-border dark:border-zinc-500/50'}`}>
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isCreatingSession
            ? 'Creating session...'
            : isListening
            ? 'Listening...'
            : !tenantId || !projectId
            ? 'Loading context...'
            : 'Ask anything or start a task...'
        }
        className={`min-h-[100px] resize-none border-0 focus-visible:ring-0 text-base p-4 pr-12 tracking-[-0.01em] bg-transparent dark:bg-transparent ${isListening ? 'bg-red-50/50 dark:bg-red-950/30' : ''}`}
        rows={3}
        disabled={isStreaming || isCreatingSession}
      />
      <div className="flex items-center justify-between p-3 bg-transparent">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <Wrench className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {/* Voice mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full transition-colors ${
              voiceMode
                ? 'bg-violet-100 text-violet-600 hover:bg-violet-200 hover:text-violet-700 dark:bg-violet-900 dark:text-violet-300 dark:hover:bg-violet-800'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={toggleVoiceMode}
            title={voiceMode ? 'Disable voice mode' : 'Enable voice mode'}
          >
            <AudioLines className="w-4 h-4" />
          </Button>
          {/* Mic button */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full transition-colors ${
              isListening
                ? 'bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={toggleVoiceInput}
            disabled={isStreaming}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!input.trim() || isStreaming || isCreatingSession || !tenantId || !projectId}
            onClick={handleSubmit}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Shared banners
  const banners = (
    <>
      {/* Session error banner */}
      {sessionError && (
        <div className="flex items-center justify-center gap-2 py-1.5 px-3 mb-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          {sessionError}
        </div>
      )}

      {/* Voice mode banner */}
      {voiceMode && (
        <div className="flex items-center justify-center gap-2 py-1.5 px-3 mb-2 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium">
          <AudioLines className="w-3.5 h-3.5 animate-pulse" />
          Voice mode active
        </div>
      )}
    </>
  );

  // ACTIVE STATE: Has messages - input fixed at viewport bottom
  if (hasMessages) {
    return (
      <>
        {/* Messages area with bottom padding for fixed input clearance */}
        <div className="pb-[200px]">
          <ChatMessages
            onSuggestionSelect={handleSuggestionSelect}
            onActionSelect={handleActionSelect}
          />
        </div>

        {/* Input area fixed at viewport bottom with gradient fade */}
        <div
          className="fixed bottom-0 right-0 z-10 pointer-events-none transition-[left] duration-200"
          style={{ left: isMobile ? 0 : (sidebarCollapsed ? 68 : 240) }}
        >
          {/* Gradient fade - messages appear to fade behind input */}
          <div className="h-16 bg-gradient-to-t from-background to-transparent" />

          {/* Input container */}
          <div className="bg-background px-4 md:px-14 pb-4 md:pb-6 pt-2 pointer-events-auto">
            <div className="max-w-2xl mx-auto">
              {banners}
              {inputArea}
            </div>
          </div>
        </div>
      </>
    );
  }

  // EMPTY STATE: Centered welcome layout
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <h1 className="text-3xl font-semibold text-foreground text-center mb-8 tracking-[-0.025em]">
          What can I do for you?
        </h1>

        {banners}
        {inputArea}

        {/* Guided Prompts - shown when input is empty */}
        {!input.trim() && (
          <ChatSuggestions
            suggestions={DEFAULT_SUGGESTIONS}
            onSelect={handleSuggestionSelect}
            variant="initial"
          />
        )}
      </motion.div>
    </div>
  );
}
