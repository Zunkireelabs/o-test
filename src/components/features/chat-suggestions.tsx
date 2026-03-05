'use client';

import { motion } from 'framer-motion';

interface ChatSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  variant?: 'initial' | 'inline';
  label?: string;
}

// Default suggestions shown when chat is empty
export const DEFAULT_SUGGESTIONS = [
  'Create a new lead',
  'Show my pipeline',
  'Assign leads to sales reps',
  'Send follow-up email',
];

export function ChatSuggestions({
  suggestions,
  onSelect,
  variant = 'initial',
  label,
}: ChatSuggestionsProps) {
  if (variant === 'inline') {
    // Inline variant: shown after assistant messages as "What next" suggestions
    return (
      <div className="mt-3">
        {label && (
          <p className="text-xs text-muted-foreground mb-2">{label}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(suggestion)}
              className="text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // Initial variant: shown below empty chat input as guided prompts
  return (
    <div className="mt-4">
      <p className="text-xs text-muted-foreground text-center mb-3">
        Try asking Orca:
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(suggestion)}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-[12px] font-medium text-muted-foreground hover:border-muted-foreground hover:text-foreground transition-colors tracking-[-0.01em]"
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
