'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Link,
  FileText,
  Upload,
  Settings,
  Code,
  Puzzle,
  Plus,
  Wrench,
  ArrowUp,
} from 'lucide-react';
import { motion } from 'framer-motion';

const quickActions = [
  { id: 'url', label: 'Ingest URL', icon: Link, section: 'ingest' as const, tab: 'url' },
  { id: 'text', label: 'Add Text', icon: FileText, section: 'ingest' as const, tab: 'text' },
  { id: 'file', label: 'Upload File', icon: Upload, section: 'ingest' as const, tab: 'file' },
  { id: 'widget', label: 'Configure Widget', icon: Settings, section: 'widget' as const },
  { id: 'embed', label: 'Get Embed Code', icon: Code, section: 'embed' as const },
  { id: 'connect', label: 'Connect App', icon: Puzzle, section: 'connectors' as const },
];

export function NewTaskSection() {
  const [input, setInput] = useState('');
  const { setCurrentSection } = useAppStore();

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setCurrentSection(action.section);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <h1 className="text-3xl font-semibold text-gray-900 text-center mb-8">
          What can I do for you?
        </h1>

        {/* Input Area */}
        <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything or start a task..."
            className="min-h-[100px] resize-none border-0 focus-visible:ring-0 text-base p-4 pr-12"
            rows={3}
          />
          <div className="flex items-center justify-between p-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                <Wrench className="w-4 h-4" />
              </Button>
            </div>
            <Button
              size="icon"
              className="h-8 w-8 rounded-full bg-gray-900 hover:bg-gray-800"
              disabled={!input.trim()}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickAction(action)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
