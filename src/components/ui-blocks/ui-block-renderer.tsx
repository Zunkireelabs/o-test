'use client';

import { LeadCard } from './lead-card';
import { LeadTable } from './lead-table';
import { StagePipeline } from './stage-pipeline';
import { ConfirmationCard } from './confirmation-card';
import { ErrorCard } from './error-card';
import { PrimitiveRenderer } from './primitive-renderer';
import type {
  UIBlock,
  UITemplate,
  isTemplateBlock,
  isComposedBlock,
  isLeadCardTemplate,
  isLeadTableTemplate,
  isStagePipelineTemplate,
  isConfirmationTemplate,
  isErrorTemplate,
} from '@/types/ui-blocks';

interface UIBlockRendererProps {
  block: UIBlock;
  onAction?: (action: string, id?: string) => void;
}

function TemplateRenderer({ template, onAction }: { template: UITemplate; onAction?: (action: string, id?: string) => void }) {
  switch (template.templateType) {
    case 'lead_card':
      return (
        <LeadCard
          data={template}
          onAction={(action, leadId) => onAction?.(action, leadId)}
        />
      );

    case 'lead_table':
      return (
        <LeadTable
          data={template}
          onAction={(action, leadId) => onAction?.(action, leadId)}
        />
      );

    case 'stage_pipeline':
      return (
        <StagePipeline
          data={template}
          onStageClick={(stageId) => onAction?.('select_stage', stageId)}
        />
      );

    case 'confirmation':
      return (
        <ConfirmationCard
          data={template}
          onAction={(action) => onAction?.(action)}
        />
      );

    case 'error':
      return (
        <ErrorCard
          data={template}
          onAction={(action) => onAction?.(action)}
        />
      );

    // TODO: Add more template renderers
    case 'meeting_card':
    case 'search_results':
    case 'place_results':
      // Fallback to JSON display for unimplemented templates
      return (
        <div className="p-4 rounded-lg bg-muted/50 border">
          <p className="text-sm text-muted-foreground mb-2">
            Template: {template.templateType}
          </p>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(template, null, 2)}
          </pre>
        </div>
      );

    default:
      return null;
  }
}

export function UIBlockRenderer({ block, onAction }: UIBlockRendererProps) {
  if (block.blockType === 'template') {
    return <TemplateRenderer template={block.template} onAction={onAction} />;
  }

  if (block.blockType === 'composed') {
    return (
      <PrimitiveRenderer
        primitive={block.root}
        onAction={(action) => onAction?.(action)}
      />
    );
  }

  return null;
}

// Export individual components for direct use
export { LeadCard } from './lead-card';
export { LeadTable } from './lead-table';
export { StagePipeline } from './stage-pipeline';
export { ConfirmationCard } from './confirmation-card';
export { ErrorCard } from './error-card';
export { PrimitiveRenderer } from './primitive-renderer';
