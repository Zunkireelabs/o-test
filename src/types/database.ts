export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      agents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          type: 'task' | 'orchestrator' | 'connector';
          config: Json;
          status: 'active' | 'inactive' | 'error';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          type: 'task' | 'orchestrator' | 'connector';
          config?: Json;
          status?: 'active' | 'inactive' | 'error';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          type?: 'task' | 'orchestrator' | 'connector';
          config?: Json;
          status?: 'active' | 'inactive' | 'error';
          updated_at?: string;
        };
      };
      workflows: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          steps: Json;
          status: 'draft' | 'active' | 'paused' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          steps?: Json;
          status?: 'draft' | 'active' | 'paused' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          steps?: Json;
          status?: 'draft' | 'active' | 'paused' | 'archived';
          updated_at?: string;
        };
      };
      knowledge_bases: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          source_type: 'file' | 'url' | 'api' | 'manual';
          config: Json;
          document_count: number;
          status: 'active' | 'syncing' | 'error';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          source_type: 'file' | 'url' | 'api' | 'manual';
          config?: Json;
          document_count?: number;
          status?: 'active' | 'syncing' | 'error';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          source_type?: 'file' | 'url' | 'api' | 'manual';
          config?: Json;
          document_count?: number;
          status?: 'active' | 'syncing' | 'error';
          updated_at?: string;
        };
      };
      integrations: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          name: string;
          config: Json;
          credentials: Json;
          status: 'connected' | 'disconnected' | 'error';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          name: string;
          config?: Json;
          credentials?: Json;
          status?: 'connected' | 'disconnected' | 'error';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider?: string;
          name?: string;
          config?: Json;
          credentials?: Json;
          status?: 'connected' | 'disconnected' | 'error';
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      agent_type: 'task' | 'orchestrator' | 'connector';
      agent_status: 'active' | 'inactive' | 'error';
      workflow_status: 'draft' | 'active' | 'paused' | 'archived';
      source_type: 'file' | 'url' | 'api' | 'manual';
      kb_status: 'active' | 'syncing' | 'error';
      integration_status: 'connected' | 'disconnected' | 'error';
    };
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Agent = Database['public']['Tables']['agents']['Row'];
export type Workflow = Database['public']['Tables']['workflows']['Row'];
export type KnowledgeBase = Database['public']['Tables']['knowledge_bases']['Row'];
export type Integration = Database['public']['Tables']['integrations']['Row'];
