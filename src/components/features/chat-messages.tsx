'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { Volume2, CheckCircle2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChatActionButtons } from '@/components/features/chat-action-buttons';
import { ChatSuggestions } from '@/components/features/chat-suggestions';
import { ToolCallList } from '@/components/features/tool-call-card';
import { UIBlockRenderer } from '@/components/ui-blocks/ui-block-renderer';
import type { ChatMessage, ChatAction } from '@/types';

/**
 * Clean message content by removing raw JSON objects that shouldn't be shown to users.
 * This is a safety net - the LLM should not output JSON, but if it does, we filter it.
 */
function cleanMessageContent(content: string): string {
  if (!content) return content;

  // Pattern to match JSON objects at the start of the message
  // Matches: {"key":"value",...} possibly followed by whitespace
  const jsonAtStartPattern = /^\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*/;

  // Remove JSON at the start of the message
  let cleaned = content.replace(jsonAtStartPattern, '');

  // Also remove any standalone JSON objects on their own line
  // This catches cases where JSON appears mid-message
  cleaned = cleaned.replace(/^\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*$/gm, '');

  // Clean up any resulting extra whitespace at the start
  cleaned = cleaned.replace(/^\s+/, '');

  return cleaned || content; // Return original if cleaning removes everything
}

interface ChatMessagesProps {
  onSuggestionSelect?: (suggestion: string) => void;
  onActionSelect?: (action: ChatAction) => void;
}

export function ChatMessages({ onSuggestionSelect, onActionSelect }: ChatMessagesProps) {
  const { messages, isStreaming, isSpeaking } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSpeaking]);

  const lastMsg = messages[messages.length - 1];
  const showSpeakingIndicator = isSpeaking && lastMsg?.role === 'assistant';

  // Handle action button clicks
  const handleAction = useCallback((action: ChatAction) => {
    if (onActionSelect) {
      onActionSelect(action);
    }
  }, [onActionSelect]);

  // Handle suggestion clicks
  const handleSuggestion = useCallback((suggestion: string) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  }, [onSuggestionSelect]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto px-0 md:px-1">
      {messages.map((msg, index) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isLast={index === messages.length - 1}
          isStreaming={isStreaming}
          onAction={handleAction}
          onSuggestion={handleSuggestion}
        />
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

// Individual message bubble component
function MessageBubble({
  message,
  isLast,
  isStreaming,
  onAction,
  onSuggestion,
}: {
  message: ChatMessage;
  isLast: boolean;
  isStreaming: boolean;
  onAction: (action: ChatAction) => void;
  onSuggestion: (suggestion: string) => void;
}) {
  const isUser = message.role === 'user';
  const isSystemEvent = message.type === 'system_event';
  const isToolResult = message.type === 'tool_result';

  // Determine if we should show actions/suggestions (only on last message when not streaming)
  const showInteractive = isLast && !isStreaming && message.role === 'assistant';

  // System event anchor style (for major actions like lead creation)
  if (isSystemEvent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-4"
      >
        {/* Tool execution cards */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <ToolCallList toolCalls={message.toolCalls} />
        )}

        <div className="p-4 bg-muted/50 border border-border rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground whitespace-pre-wrap">
                {cleanMessageContent(message.content)}
              </div>

              {/* Action buttons */}
              {showInteractive && message.actions && (
                <ChatActionButtons actions={message.actions} onAction={onAction} />
              )}

              {/* Next suggestions */}
              {showInteractive && message.nextSuggestions && (
                <ChatSuggestions
                  suggestions={message.nextSuggestions}
                  onSelect={onSuggestion}
                  variant="inline"
                  label="You can now:"
                />
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Tool result style (for structured data responses)
  if (isToolResult) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-2"
      >
        {/* Tool execution cards */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <ToolCallList toolCalls={message.toolCalls} />
        )}

        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm text-foreground whitespace-pre-wrap">
                {cleanMessageContent(message.content)}
              </div>

              {/* Action buttons */}
              {showInteractive && message.actions && (
                <ChatActionButtons actions={message.actions} onAction={onAction} />
              )}

              {/* Next suggestions */}
              {showInteractive && message.nextSuggestions && (
                <ChatSuggestions
                  suggestions={message.nextSuggestions}
                  onSelect={onSuggestion}
                  variant="inline"
                  label="You can now:"
                />
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Standard message bubble
  // Clean content for assistant messages (filter out any raw JSON)
  const displayContent = isUser ? message.content : cleanMessageContent(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={isUser ? 'max-w-[80%]' : 'w-full'}>
        {/* Tool execution cards for assistant messages */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <ToolCallList toolCalls={message.toolCalls} />
        )}

        {/* Generative UI blocks */}
        {!isUser && message.uiBlocks && message.uiBlocks.length > 0 && (
          <div className="space-y-3 my-3">
            {message.uiBlocks.map((block, index) => (
              <UIBlockRenderer
                key={index}
                block={block}
                onAction={(action, id) => {
                  // Convert UI block action to chat action
                  const actionMessage = id
                    ? `${action} for lead ${id}`
                    : action;
                  onAction({ type: 'custom', label: actionMessage });
                }}
              />
            ))}
          </div>
        )}

        {/* Only show text content if there's actual text (not just whitespace) */}
        {displayContent.trim() && (
          <div
            className={`text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? 'rounded-2xl px-4 py-2.5 bg-muted text-foreground'
                : 'text-foreground'
            }`}
          >
            {displayContent}
          </div>
        )}

        {/* Action buttons for assistant messages */}
        {!isUser && showInteractive && message.actions && (
          <ChatActionButtons actions={message.actions} onAction={onAction} />
        )}

        {/* Next suggestions for assistant messages */}
        {!isUser && showInteractive && message.nextSuggestions && (
          <ChatSuggestions
            suggestions={message.nextSuggestions}
            onSelect={onSuggestion}
            variant="inline"
            label="You can now:"
          />
        )}
      </div>
    </motion.div>
  );
}
