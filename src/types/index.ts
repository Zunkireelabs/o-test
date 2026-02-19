export interface User {
  id: string;
  email: string;
  name: string;
  site_id: string;
  created_at: string;
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

export type NavSection =
  | 'newtask'
  | 'ingest'
  | 'jobs'
  | 'knowledge'
  | 'widget'
  | 'embed'
  | 'connectors'
  | 'profile';
