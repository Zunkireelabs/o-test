export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_subscriptions: {
        Row: {
          agent_id: string
          created_at: string | null
          event_type: string
          id: string
          tenant_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          event_type: string
          id?: string
          tenant_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_subscriptions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          project_id: string | null
          status: Database["public"]["Enums"]["agent_status"] | null
          tenant_id: string | null
          type: Database["public"]["Enums"]["agent_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["agent_status"] | null
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["agent_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["agent_status"] | null
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["agent_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string
          tool_calls: Json | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id: string
          tool_calls?: Json | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string
          tool_calls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          tenant_id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          tenant_id: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_store: {
        Row: {
          chain_depth: number | null
          created_at: string | null
          error: string | null
          event_type: string
          id: string
          idempotency_key: string
          max_attempts: number
          next_retry_at: string | null
          payload: Json
          processed_at: string | null
          processing_started_at: string | null
          project_id: string
          retry_count: number
          source_agent_id: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          chain_depth?: number | null
          created_at?: string | null
          error?: string | null
          event_type: string
          id?: string
          idempotency_key: string
          max_attempts?: number
          next_retry_at?: string | null
          payload: Json
          processed_at?: string | null
          processing_started_at?: string | null
          project_id: string
          retry_count?: number
          source_agent_id?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          chain_depth?: number | null
          created_at?: string | null
          error?: string | null
          event_type?: string
          id?: string
          idempotency_key?: string
          max_attempts?: number
          next_retry_at?: string | null
          payload?: Json
          processed_at?: string | null
          processing_started_at?: string | null
          project_id?: string
          retry_count?: number
          source_agent_id?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_store_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_store_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          credentials: Json | null
          id: string
          name: string
          project_id: string | null
          provider: string
          status: Database["public"]["Enums"]["integration_status"] | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          name: string
          project_id?: string | null
          provider: string
          status?: Database["public"]["Enums"]["integration_status"] | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          name?: string
          project_id?: string | null
          provider?: string
          status?: Database["public"]["Enums"]["integration_status"] | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_bases: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          document_count: number | null
          id: string
          name: string
          project_id: string | null
          source_type: Database["public"]["Enums"]["source_type"]
          status: Database["public"]["Enums"]["kb_status"] | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          document_count?: number | null
          id?: string
          name: string
          project_id?: string | null
          source_type?: Database["public"]["Enums"]["source_type"]
          status?: Database["public"]["Enums"]["kb_status"] | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          document_count?: number | null
          id?: string
          name?: string
          project_id?: string | null
          source_type?: Database["public"]["Enums"]["source_type"]
          status?: Database["public"]["Enums"]["kb_status"] | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_bases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_bases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_bases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          created_at: string | null
          email: string
          event_id: string | null
          id: string
          metadata: Json | null
          name: string | null
          project_id: string
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email: string
          event_id?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          project_id: string
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string
          event_id?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          project_id?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          id: string
          name: string
          status: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          status?: string | null
          tenant_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          status?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_credentials: {
        Row: {
          client_id: string
          client_secret: string
          created_at: string | null
          credential_key: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          client_secret: string
          created_at?: string | null
          credential_key: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          client_secret?: string
          created_at?: string | null
          credential_key?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          created_at: string | null
          id: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          config: Json | null
          created_at: string | null
          hmac_secret: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          hmac_secret: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          hmac_secret?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          project_id: string | null
          status: Database["public"]["Enums"]["workflow_status"] | null
          steps: Json | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["workflow_status"] | null
          steps?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["workflow_status"] | null
          steps?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_tenant_member: { Args: { check_tenant_id: string }; Returns: boolean }
      is_tenant_owner: { Args: { p_tenant_id: string }; Returns: boolean }
      is_tenant_admin: { Args: { p_tenant_id: string }; Returns: boolean }
      get_user_tenant_role: { Args: { p_tenant_id: string }; Returns: string | null }
    }
    Enums: {
      agent_status: "active" | "inactive" | "error"
      agent_type: "task" | "orchestrator" | "connector"
      integration_status: "connected" | "disconnected" | "error"
      kb_status: "active" | "syncing" | "error"
      source_type: "file" | "url" | "api" | "manual"
      workflow_status: "draft" | "active" | "paused" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agent_status: ["active", "inactive", "error"],
      agent_type: ["task", "orchestrator", "connector"],
      integration_status: ["connected", "disconnected", "error"],
      kb_status: ["active", "syncing", "error"],
      source_type: ["file", "url", "api", "manual"],
      workflow_status: ["draft", "active", "paused", "archived"],
    },
  },
} as const

// Convenience types
export type Profile = Tables<"profiles">
export type Agent = Tables<"agents">
export type Workflow = Tables<"workflows">
export type KnowledgeBase = Tables<"knowledge_bases">
export type Integration = Tables<"integrations">
export type ProviderCredential = Tables<"provider_credentials">

// Multi-tenant types
export type Tenant = Tables<"tenants">
export type TenantUser = Tables<"tenant_users">
export type Project = Tables<"projects">
export type EventStoreRecord = Tables<"event_store">
export type AgentSubscription = Tables<"agent_subscriptions">
export type Lead = Tables<"leads">

// Chat types
export type ChatSession = Tables<"chat_sessions">
export type ChatMessage = Tables<"chat_messages">

// ============================================
// Connector Integration Types (Manual)
// These are defined manually until migration is run
// and types are regenerated with `supabase gen types`
// ============================================

export interface ConnectorIntegrationRow {
  id: string
  tenant_id: string
  provider_type: string
  status: 'connected' | 'disconnected'
  config: Record<string, unknown> | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface ConnectorIntegrationInsert {
  id?: string
  tenant_id: string
  provider_type: string
  status?: 'connected' | 'disconnected'
  config?: Record<string, unknown> | null
  is_primary?: boolean
  created_at?: string
  updated_at?: string
}

export interface ConnectorIntegrationUpdate {
  id?: string
  tenant_id?: string
  provider_type?: string
  status?: 'connected' | 'disconnected'
  config?: Record<string, unknown> | null
  is_primary?: boolean
  created_at?: string
  updated_at?: string
}

export interface ConnectorCredentialsRow {
  id: string
  integration_id: string
  encrypted_credentials: string // AES-256-GCM encrypted, base64 encoded
  scopes: string[] | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface ConnectorCredentialsInsert {
  id?: string
  integration_id: string
  encrypted_credentials: string // AES-256-GCM encrypted, base64 encoded
  scopes?: string[] | null
  expires_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface ConnectorCredentialsUpdate {
  id?: string
  integration_id?: string
  encrypted_credentials?: string // AES-256-GCM encrypted, base64 encoded
  scopes?: string[] | null
  expires_at?: string | null
  created_at?: string
  updated_at?: string
}

// Convenience type aliases
export type ConnectorIntegration = ConnectorIntegrationRow
export type ConnectorCredentials = ConnectorCredentialsRow
