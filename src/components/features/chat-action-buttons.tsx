'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { ChatAction } from '@/types';
import {
  UserPlus,
  ArrowRightCircle,
  Mail,
  LayoutGrid,
  Plus,
  Pencil,
  Zap,
} from 'lucide-react';

interface ChatActionButtonsProps {
  actions: ChatAction[];
  onAction: (action: ChatAction) => void;
}

// Icon mapping for action types
const actionIcons: Record<ChatAction['type'], React.ElementType> = {
  assign_lead: UserPlus,
  move_stage: ArrowRightCircle,
  send_email: Mail,
  view_pipeline: LayoutGrid,
  create_lead: Plus,
  update_lead: Pencil,
  custom: Zap,
};

export function ChatActionButtons({ actions, onAction }: ChatActionButtonsProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {actions.map((action, i) => {
        const Icon = actionIcons[action.type] || Zap;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(action)}
              className="gap-1.5 text-xs font-medium"
            >
              <Icon className="w-3.5 h-3.5" />
              {action.label}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}
