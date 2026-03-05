/**
 * Generative UI Type Definitions
 *
 * Hybrid approach:
 * - Templates: Pre-defined components for common data (leads, stages)
 * - Primitives: Building blocks AI can compose for novel layouts
 */

// =============================================================================
// PRIMITIVES — Building blocks for AI-composed UIs
// =============================================================================

export interface TextPrimitive {
  type: 'text';
  content: string;
  variant?: 'heading' | 'subheading' | 'body' | 'caption' | 'label';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'muted' | 'success' | 'error' | 'warning' | 'info';
}

export interface CardPrimitive {
  type: 'card';
  header?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  children: UIPrimitive[];
}

export interface TablePrimitive {
  type: 'table';
  columns: Array<{
    key: string;
    label: string;
    width?: string;
  }>;
  rows: Array<Record<string, string | number | boolean | null>>;
  sortable?: boolean;
  compact?: boolean;
}

export type BadgeColor = 'default' | 'success' | 'error' | 'warning' | 'info' | 'purple' | 'blue';

export interface ListPrimitive {
  type: 'list';
  items: Array<{
    primary: string;
    secondary?: string;
    icon?: string;
    badge?: { label: string; color?: BadgeColor };
  }>;
  ordered?: boolean;
  variant?: 'simple' | 'detailed';
}

export interface GridPrimitive {
  type: 'grid';
  columns: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  children: UIPrimitive[];
}

export interface BadgePrimitive {
  type: 'badge';
  label: string;
  color?: BadgeColor;
}

export interface ButtonPrimitive {
  type: 'button';
  label: string;
  action: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
}

export interface AvatarPrimitive {
  type: 'avatar';
  name: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface ProgressPrimitive {
  type: 'progress';
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
}

export interface TimelinePrimitive {
  type: 'timeline';
  events: Array<{
    date: string;
    title: string;
    description?: string;
    status?: 'completed' | 'current' | 'pending';
  }>;
}

export interface DividerPrimitive {
  type: 'divider';
  label?: string;
}

export interface SpacerPrimitive {
  type: 'spacer';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface LayoutPrimitive {
  type: 'layout';
  direction: 'horizontal' | 'vertical';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  gap?: 'xs' | 'sm' | 'md' | 'lg';
  children: UIPrimitive[];
}

export interface ActionsPrimitive {
  type: 'actions';
  buttons: Array<{
    label: string;
    action: string;
    variant?: 'default' | 'outline' | 'ghost';
    icon?: string;
  }>;
  align?: 'start' | 'center' | 'end';
}

export interface KeyValuePrimitive {
  type: 'key-value';
  items: Array<{
    key: string;
    value: string | number | boolean | null;
    copyable?: boolean;
  }>;
  layout?: 'horizontal' | 'vertical' | 'grid';
}

export interface StatPrimitive {
  type: 'stat';
  label: string;
  value: string | number;
  change?: {
    value: number;
    direction: 'up' | 'down';
  };
  icon?: string;
}

// Union of all primitives
export type UIPrimitive =
  | TextPrimitive
  | CardPrimitive
  | TablePrimitive
  | ListPrimitive
  | GridPrimitive
  | BadgePrimitive
  | ButtonPrimitive
  | AvatarPrimitive
  | ProgressPrimitive
  | TimelinePrimitive
  | DividerPrimitive
  | SpacerPrimitive
  | LayoutPrimitive
  | ActionsPrimitive
  | KeyValuePrimitive
  | StatPrimitive;

// =============================================================================
// TEMPLATES — Pre-defined components for common data types
// =============================================================================

export interface LeadData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  stage?: string;
  stageName?: string;
  stageId?: string;
  owner?: string;
  ownerId?: string;
  createdAt?: string;
  source?: string;
}

export interface StageData {
  id: string;
  name: string;
  order: number;
  isTerminal?: boolean;
  color?: string;
  leadCount?: number;
}

// Template: Single Lead Card
export interface LeadCardTemplate {
  templateType: 'lead_card';
  action: 'created' | 'updated' | 'moved' | 'assigned' | 'view';
  lead: LeadData;
  previousStage?: string;
  newStage?: string;
  assignedTo?: string;
  actions?: Array<'assign' | 'move_stage' | 'send_email' | 'edit' | 'delete'>;
}

// Template: Lead Table
export interface LeadTableTemplate {
  templateType: 'lead_table';
  leads: LeadData[];
  title?: string;
  sortable?: boolean;
  showStage?: boolean;
  showOwner?: boolean;
  actions?: Array<'assign' | 'move_stage' | 'send_email' | 'edit'>;
}

// Template: Stage Pipeline
export interface StagePipelineTemplate {
  templateType: 'stage_pipeline';
  stages: StageData[];
  currentStageId?: string;
  showLeadCounts?: boolean;
  interactive?: boolean;
}

// Template: Confirmation Message
export interface ConfirmationTemplate {
  templateType: 'confirmation';
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  details?: Array<{ label: string; value: string }>;
  actions?: Array<{
    label: string;
    action: string;
    variant?: 'default' | 'outline';
  }>;
}

// Template: Error Message
export interface ErrorTemplate {
  templateType: 'error';
  title: string;
  message: string;
  details?: string;
  retryAction?: string;
}

// Template: Meeting Card
export interface MeetingCardTemplate {
  templateType: 'meeting_card';
  action: 'created' | 'updated' | 'view';
  meeting: {
    id: string;
    title: string;
    startTime: string;
    endTime?: string;
    meetLink?: string;
    attendees?: string[];
  };
  actions?: Array<'join' | 'copy_link' | 'add_to_calendar'>;
}

// Template: Search Results
export interface SearchResultsTemplate {
  templateType: 'search_results';
  query: string;
  results: Array<{
    title: string;
    url?: string;
    snippet: string;
    source?: string;
  }>;
}

// Template: Place Results
export interface PlaceResultsTemplate {
  templateType: 'place_results';
  query: string;
  places: Array<{
    name: string;
    address: string;
    rating?: number;
    priceLevel?: string;
    placeId?: string;
  }>;
}

// Union of all templates
export type UITemplate =
  | LeadCardTemplate
  | LeadTableTemplate
  | StagePipelineTemplate
  | ConfirmationTemplate
  | ErrorTemplate
  | MeetingCardTemplate
  | SearchResultsTemplate
  | PlaceResultsTemplate;

// =============================================================================
// UI BLOCK — Container for either template or composed primitives
// =============================================================================

export interface TemplateBlock {
  blockType: 'template';
  template: UITemplate;
}

export interface ComposedBlock {
  blockType: 'composed';
  root: UIPrimitive;
}

export type UIBlock = TemplateBlock | ComposedBlock;

// =============================================================================
// SSE EVENT PAYLOAD
// =============================================================================

export interface UIBlockEvent {
  type: 'ui_block';
  block: UIBlock;
}

// Helper type guards
export function isTemplateBlock(block: UIBlock): block is TemplateBlock {
  return block.blockType === 'template';
}

export function isComposedBlock(block: UIBlock): block is ComposedBlock {
  return block.blockType === 'composed';
}

export function isLeadCardTemplate(template: UITemplate): template is LeadCardTemplate {
  return template.templateType === 'lead_card';
}

export function isLeadTableTemplate(template: UITemplate): template is LeadTableTemplate {
  return template.templateType === 'lead_table';
}

export function isStagePipelineTemplate(template: UITemplate): template is StagePipelineTemplate {
  return template.templateType === 'stage_pipeline';
}

export function isConfirmationTemplate(template: UITemplate): template is ConfirmationTemplate {
  return template.templateType === 'confirmation';
}

export function isErrorTemplate(template: UITemplate): template is ErrorTemplate {
  return template.templateType === 'error';
}
