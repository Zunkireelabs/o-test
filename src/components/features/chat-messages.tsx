'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function ChatMessages() {
  const { messages, isStreaming, isSpeaking } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSpeaking]);

  const lastMsg = messages[messages.length - 1];
  const showSpeakingIndicator = isSpeaking && lastMsg?.role === 'assistant';

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto px-1">
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'max-w-[80%] rounded-2xl px-4 py-2.5 bg-muted text-foreground'
                : 'text-foreground'
            }`}
          >
            {msg.content}
          </div>
        </motion.div>
      ))}

      {isStreaming && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="text-sm font-medium bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer">
              Thinking
            </span>
          </div>
        </motion.div>
      )}

      {showSpeakingIndicator && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300 text-xs font-medium">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            Speaking...
          </div>
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
