export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Job {
  id: string;
  source_type: 'url' | 'text' | 'file';
  source: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  chunk_count: number;
  created_at: string;
  error?: string;
}

export interface WidgetConfig {
  brand_name: string;
  tone: 'neutral' | 'formal' | 'friendly';
  primary_color: string;
  welcome_message: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  source_type: string;
  chunk_count: number;
  created_at: string;
}

export interface ApiKeys {
  client_key_preview: string;
  openai_key_set: boolean;
}

export interface ConnectorApp {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  connected: boolean;
  connector_id?: string;
}

// Action types for interactive buttons in AI responses
export interface ChatAction {
  type: 'assign_lead' | 'move_stage' | 'send_email' | 'view_pipeline' | 'create_lead' | 'update_lead' | 'custom';
  label: string;
  payload?: Record<string, unknown>;
}

// Message types for visual differentiation
export type ChatMessageType = 'text' | 'system_event' | 'tool_result';

// Tool call status for displaying execution progress
export interface ToolCallStatus {
  id: string;
  name: string;
  displayName: string;
  status: 'running' | 'completed' | 'error';
  summary?: string; // e.g., "1 lead created", "9 results"
  icon?: string; // Icon type: 'crm', 'email', 'search', 'calendar', 'web'
}

// Re-export UI block types
export type { UIBlock, UITemplate, UIPrimitive } from './ui-blocks';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  // UX enhancements
  type?: ChatMessageType;
  actions?: ChatAction[];
  nextSuggestions?: string[];
  toolCalls?: ToolCallStatus[];
  // Generative UI blocks
  uiBlocks?: import('./ui-blocks').UIBlock[];
}

export interface ChatSession {
  id: string;
  tenant_id: string;
  project_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export type NavSection =
  // Beta (active)
  | 'newtask'
  | 'connectors'
  | 'activity'
  | 'settings'
  | 'profile'
  // Phase 4+ (coming soon)
  | 'agents'
  | 'knowledge'
  | 'insights'
  // Legacy (code exists, hidden in nav)
  | 'ingest'
  | 'jobs'
  | 'widget'
  | 'embed';
