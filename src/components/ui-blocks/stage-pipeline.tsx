'use client';

import { ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StagePipelineTemplate, StageData } from '@/types/ui-blocks';

interface StagePipelineProps {
  data: StagePipelineTemplate;
  onStageClick?: (stageId: string) => void;
}

// Get stage color based on position or terminal status
function getStageStyle(stage: StageData, isActive: boolean, total: number): {
  bg: string;
  border: string;
  text: string;
  icon?: 'check' | 'x';
} {
  // Terminal stages
  if (stage.isTerminal) {
    if (stage.name.toLowerCase().includes('lost') || stage.name.toLowerCase().includes('rejected')) {
      return {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-700 dark:text-red-300',
        icon: 'x',
      };
    }
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-300',
      icon: 'check',
    };
  }

  // Active stage
  if (isActive) {
    return {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-300 dark:border-blue-700',
      text: 'text-blue-700 dark:text-blue-300',
    };
  }

  // Regular stages - gradient based on position
  const colors = [
    { bg: 'bg-violet-50 dark:bg-violet-950/20', border: 'border-violet-200 dark:border-violet-800', text: 'text-violet-700 dark:text-violet-300' },
    { bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-300' },
    { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' },
    { bg: 'bg-cyan-50 dark:bg-cyan-950/20', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-300' },
    { bg: 'bg-teal-50 dark:bg-teal-950/20', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-300' },
    { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300' },
  ];

  const index = Math.min(stage.order - 1, colors.length - 1);
  return colors[Math.max(0, index)];
}

export function StagePipeline({ data, onStageClick }: StagePipelineProps) {
  const { stages, currentStageId, showLeadCounts = false, interactive = false } = data;

  // Sort stages by order
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  // Separate terminal and non-terminal stages
  const regularStages = sortedStages.filter((s) => !s.isTerminal);
  const terminalStages = sortedStages.filter((s) => s.isTerminal);

  const handleStageClick = (stageId: string) => {
    if (interactive && onStageClick) {
      onStageClick(stageId);
    }
  };

  const StageBox = ({ stage }: { stage: StageData }) => {
    const isActive = stage.id === currentStageId;
    const style = getStageStyle(stage, isActive, stages.length);

    return (
      <div
        onClick={() => handleStageClick(stage.id)}
        className={cn(
          'relative flex flex-col items-center justify-center min-w-[120px] px-4 py-3 rounded-lg border-2 transition-all',
          style.bg,
          style.border,
          isActive && 'ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-background',
          interactive && 'cursor-pointer hover:scale-105',
        )}
      >
        {/* Terminal icon */}
        {style.icon === 'check' && (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute -top-2 -right-2 bg-white dark:bg-background rounded-full" />
        )}
        {style.icon === 'x' && (
          <XCircle className="w-4 h-4 text-red-500 absolute -top-2 -right-2 bg-white dark:bg-background rounded-full" />
        )}

        <span className={cn('text-sm font-medium text-center leading-tight', style.text)}>
          {stage.name}
        </span>

        {showLeadCounts && stage.leadCount !== undefined && (
          <Badge variant="secondary" className="mt-1.5 text-xs">
            {stage.leadCount} lead{stage.leadCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Pipeline Overview</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {stages.length} stage{stages.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Regular stages row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {regularStages.map((stage, index) => (
            <div key={stage.id} className="flex items-center">
              <StageBox stage={stage} />
              {index < regularStages.length - 1 && (
                <ChevronRight className="w-5 h-5 text-muted-foreground mx-1 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Terminal stages row */}
        {terminalStages.length > 0 && (
          <>
            <div className="my-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground px-2">Terminal Stages</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="flex items-center gap-3">
              {terminalStages.map((stage) => (
                <StageBox key={stage.id} stage={stage} />
              ))}
            </div>
          </>
        )}

        {/* Legend */}
        <div className="mt-4 pt-3 border-t flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Won</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Lost</span>
          </div>
          {currentStageId && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border-2 border-blue-400" />
              <span>Current</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
