'use client';

import { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useChatStore } from '@/stores/chat-store';
import { useTTS } from '@/hooks/use-tts';
import { ChatMessages } from '@/components/features/chat-messages';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Link,
  FileText,
  Upload,
  Puzzle,
  Plus,
  Wrench,
  ArrowUp,
  Mic,
  MicOff,
  AudioLines,
} from 'lucide-react';
import { motion } from 'framer-motion';

const quickActions = [
  { id: 'url', label: 'Ingest URL', icon: Link, section: 'ingest' as const, tab: 'url' },
  { id: 'text', label: 'Add Text', icon: FileText, section: 'ingest' as const, tab: 'text' },
  { id: 'file', label: 'Upload File', icon: Upload, section: 'ingest' as const, tab: 'file' },
  { id: 'connect', label: 'Connect App', icon: Puzzle, section: 'connectors' as const },
];

export function NewTaskSection() {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const voiceTranscriptRef = useRef('');
  const autoSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doSubmitRef = useRef<((text: string) => Promise<void>) | undefined>(undefined);
  const { setCurrentSection } = useAppStore();
  const {
    messages, isStreaming, voiceMode,
    addMessage, appendToLastMessage, setStreaming, setVoiceMode,
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

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setCurrentSection(action.section);
  };

  // Core submit logic shared by manual and voice-triggered submission
  const doSubmit = useCallback(async (text: string) => {
    if (!text || isStreaming) return;

    // Stop TTS if currently speaking
    stopTTS();

    // Stop voice if active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    setInput('');

    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: text };
    addMessage(userMsg);

    const assistantMsg = { id: crypto.randomUUID(), role: 'assistant' as const, content: '' };
    addMessage(assistantMsg);
    setStreaming(true);

    let responseText = '';

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          responseText += chunk;
          appendToLastMessage(chunk);
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
  }, [isStreaming, isListening, messages, addMessage, appendToLastMessage, setStreaming, stopTTS, speak, startListening]);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {hasMessages ? (
          <ChatMessages />
        ) : (
          <h1 className="text-3xl font-semibold text-zinc-900 text-center mb-8 tracking-[-0.025em]">
            What can I do for you?
          </h1>
        )}

        {/* Voice mode banner */}
        {voiceMode && (
          <div className="flex items-center justify-center gap-2 py-1.5 px-3 mb-2 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium">
            <AudioLines className="w-3.5 h-3.5 animate-pulse" />
            Voice mode active
          </div>
        )}

        {/* Input Area */}
        <div className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden ${voiceMode ? 'border-violet-300' : 'border-zinc-200'}`}>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening...' : 'Ask anything or start a task...'}
            className={`min-h-[100px] resize-none border-0 focus-visible:ring-0 text-base p-4 pr-12 tracking-[-0.01em] ${isListening ? 'bg-red-50/50' : ''}`}
            rows={3}
            disabled={isStreaming}
          />
          <div className="flex items-center justify-between p-3 border-t border-zinc-100">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
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
                    ? 'bg-violet-100 text-violet-600 hover:bg-violet-200 hover:text-violet-700'
                    : 'text-zinc-400 hover:text-zinc-600'
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
                    ? 'bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
                onClick={toggleVoiceInput}
                disabled={isStreaming}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                className="h-8 w-8 rounded-full bg-zinc-900 hover:bg-zinc-800"
                disabled={!input.trim() || isStreaming}
                onClick={handleSubmit}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {!hasMessages && (
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuickAction(action)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-full text-[12px] font-medium text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 transition-colors tracking-[-0.01em]"
                >
                  <Icon className="w-4 h-4" />
                  {action.label}
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
