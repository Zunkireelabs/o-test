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
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mb-4 max-h-[50vh] overflow-y-auto px-1">
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-800'
            }`}
          >
            {msg.content}
          </div>
        </motion.div>
      ))}

      {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
        <div className="flex justify-start">
          <div className="bg-zinc-100 rounded-2xl px-4 py-3 flex gap-1">
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse" />
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse [animation-delay:0.4s]" />
          </div>
        </div>
      )}

      {showSpeakingIndicator && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-medium">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            Speaking...
          </div>
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
