'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ToolCallStatus } from '@/types';
import {
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Users,
  Mail,
  Search,
  Calendar,
  Globe,
  Database,
  Zap,
  ArrowRightLeft,
  MapPin,
} from 'lucide-react';

interface ToolCallCardProps {
  toolCall: ToolCallStatus;
  isLast?: boolean;
}

// Map tool names to display names and icons
const toolConfig: Record<string, { displayName: string; icon: React.ElementType; color: string }> = {
  // CRM tools
  create_crm_lead: { displayName: 'Creating lead in CRM', icon: Users, color: 'text-emerald-500' },
  update_crm_lead: { displayName: 'Updating lead in CRM', icon: Users, color: 'text-blue-500' },
  get_crm_leads: { displayName: 'Fetching leads from CRM', icon: Users, color: 'text-violet-500' },
  move_crm_lead_stage: { displayName: 'Moving lead to new stage', icon: ArrowRightLeft, color: 'text-orange-500' },
  assign_crm_lead: { displayName: 'Assigning lead', icon: Users, color: 'text-cyan-500' },
  get_crm_stages: { displayName: 'Fetching pipeline stages', icon: Database, color: 'text-slate-500' },

  // Email tools
  send_email: { displayName: 'Sending email', icon: Mail, color: 'text-red-500' },
  emit_event: { displayName: 'Processing request', icon: Zap, color: 'text-yellow-500' },

  // Meeting tools
  create_meeting: { displayName: 'Creating meeting', icon: Calendar, color: 'text-blue-500' },
  list_upcoming_meetings: { displayName: 'Fetching meetings', icon: Calendar, color: 'text-blue-500' },
  get_meeting_details: { displayName: 'Getting meeting details', icon: Calendar, color: 'text-blue-500' },

  // Search tools
  web_search: { displayName: 'Searching the web', icon: Globe, color: 'text-green-500' },
  browse_url: { displayName: 'Reading web page', icon: Globe, color: 'text-green-500' },
  search_places: { displayName: 'Searching places', icon: MapPin, color: 'text-rose-500' },
  get_directions: { displayName: 'Getting directions', icon: MapPin, color: 'text-rose-500' },
  get_place_details: { displayName: 'Getting place details', icon: MapPin, color: 'text-rose-500' },

  // Database tools
  query_leads: { displayName: 'Querying leads', icon: Database, color: 'text-indigo-500' },
};

// Get config for a tool, with fallback
function getToolConfig(name: string) {
  return toolConfig[name] || {
    displayName: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    icon: Zap,
    color: 'text-muted-foreground'
  };
}

export function ToolCallCard({ toolCall, isLast = false }: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = getToolConfig(toolCall.name);
  const Icon = config.icon;

  const isRunning = toolCall.status === 'running';
  const isCompleted = toolCall.status === 'completed';
  const isError = toolCall.status === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Timeline connector line */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-px bg-border" />
      )}

      {/* Card */}
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isRunning && 'bg-blue-100 dark:bg-blue-900/30',
          isCompleted && 'bg-emerald-100 dark:bg-emerald-900/30',
          isError && 'bg-red-100 dark:bg-red-900/30',
        )}>
          {isRunning && (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          )}
          {isCompleted && (
            <Check className="w-4 h-4 text-emerald-500" />
          )}
          {isError && (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header - clickable to expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between gap-2 text-left group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon className={cn('w-4 h-4 flex-shrink-0', config.color)} />
              <span className={cn(
                'text-sm font-medium truncate',
                isRunning && 'text-foreground',
                isCompleted && 'text-muted-foreground',
                isError && 'text-red-600 dark:text-red-400',
              )}>
                {toolCall.displayName || config.displayName}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Summary badge */}
              {toolCall.summary && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {toolCall.summary}
                </span>
              )}

              {/* Expand/collapse chevron */}
              <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </span>
            </div>
          </button>

          {/* Expanded content - placeholder for future detail view */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                  <div className="font-mono">
                    Tool: {toolCall.name}
                  </div>
                  {toolCall.summary && (
                    <div className="mt-1">
                      Result: {toolCall.summary}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// Container for multiple tool calls
interface ToolCallListProps {
  toolCalls: ToolCallStatus[];
}

export function ToolCallList({ toolCalls }: ToolCallListProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="space-y-2 my-3">
      {toolCalls.map((toolCall, index) => (
        <ToolCallCard
          key={toolCall.id}
          toolCall={toolCall}
          isLast={index === toolCalls.length - 1}
        />
      ))}
    </div>
  );
}
