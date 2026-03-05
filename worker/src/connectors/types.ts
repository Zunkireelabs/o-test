/**
 * Connector Types for Worker
 *
 * Types aligned with GenXcrm OpenAPI 3.0 spec.
 */

// ============================================
// CRM CONNECTOR INTERFACE
// ============================================

export interface CRMConnector {
  getLeads(filters?: LeadFilters): Promise<LeadListResponse>
  createLead(data: CreateLeadData, idempotencyKey?: string): Promise<CRMLead>
  updateLead(id: string, data: UpdateLeadData): Promise<CRMLead>
  getLeadById(id: string): Promise<CRMLeadDetail | null>
  assignLead?(id: string, userId: string, idempotencyKey?: string): Promise<CRMLead>
  moveStage?(id: string, stageId: string, idempotencyKey?: string): Promise<CRMLead>
  listStages?(): Promise<CRMStage[]>
  getPipeline?(): Promise<PipelineGroup[]>
  getChecklists?(leadId: string): Promise<ChecklistItem[]>
}

// ============================================
// LEAD FILTERS (per OpenAPI listLeads params)
// ============================================

export interface LeadFilters {
  stage_id?: string
  assigned_to?: string
  search?: string
  limit?: number
  offset?: number
}

// ============================================
// LEAD RESPONSE (per OpenAPI listLeads response)
// ============================================

export interface LeadListResponse {
  leads: CRMLead[]
  total: number
  limit: number
  offset: number
}

// ============================================
// NORMALIZED LEAD (per OpenAPI NormalizedLead)
// ============================================

export interface CRMLead {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  status: string
  stage_id: string | null
  stage_slug: string | null
  stage_name: string | null
  assigned_to: string | null
  assigned_name: string | null
  custom_fields: Record<string, unknown>
  file_urls: Record<string, string>
  intake_source: string | null
  intake_medium: string | null
  intake_campaign: string | null
  preferred_contact_method: string | null
  is_final: boolean
  created_at: string
  updated_at: string
}

// ============================================
// NORMALIZED LEAD DETAIL (extends NormalizedLead)
// ============================================

export interface CRMLeadDetail extends CRMLead {
  checklist_total: number
  checklist_completed: number
}

// ============================================
// CREATE LEAD REQUEST (per OpenAPI CreateLeadRequest)
// ============================================

export interface CreateLeadData {
  first_name: string
  email: string
  last_name?: string
  phone?: string
  city?: string
  country?: string
  stage_id?: string
  status?: string
  custom_fields?: Record<string, unknown>
  file_urls?: Record<string, string>
  intake_source?: string
  intake_medium?: string
  intake_campaign?: string
  preferred_contact_method?: string
}

// ============================================
// UPDATE LEAD REQUEST (per OpenAPI UpdateLeadRequest)
// ============================================

export interface UpdateLeadData {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  city?: string
  country?: string
  status?: string
  stage_id?: string
  assigned_to?: string | null
  custom_fields?: Record<string, unknown>
  file_urls?: Record<string, string>
  intake_source?: string
  intake_medium?: string
  intake_campaign?: string
  preferred_contact_method?: string
}

// ============================================
// NORMALIZED STAGE (per OpenAPI NormalizedStage)
// ============================================

export interface CRMStage {
  id: string
  slug: string
  name: string
  position: number
  color: string
  is_default: boolean
  is_terminal: boolean
}

// ============================================
// PIPELINE GROUP (per OpenAPI PipelineGroup)
// ============================================

export interface PipelineGroup {
  stage: CRMStage
  leads: CRMLead[]
}

// ============================================
// CHECKLIST ITEM (per OpenAPI ChecklistItem)
// ============================================

export interface ChecklistItem {
  id: string
  title: string
  is_completed: boolean
  completed_at: string | null
  completed_by: string | null
  position: number
  created_at: string
}

// ============================================
// EMAIL CONNECTOR INTERFACE
// ============================================

export interface EmailConnector {
  sendEmail(data: SendEmailData): Promise<EmailResult>
  getThreads?(): Promise<EmailThread[]>
  replyToThread?(data: ReplyToThreadData): Promise<EmailResult>
}

export interface SendEmailData {
  to: string | string[]
  subject: string
  body: string
  bodyType?: 'text' | 'html'
  cc?: string[]
  bcc?: string[]
  replyTo?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface EmailThread {
  id: string
  subject: string
  participants: string[]
  lastMessageAt: string
  messageCount: number
}

export interface ReplyToThreadData {
  threadId: string
  body: string
  bodyType?: 'text' | 'html'
}

// ============================================
// INTEGRATION & CREDENTIALS TYPES
// ============================================

export interface ConnectorIntegration {
  id: string
  tenant_id: string
  provider_type: string
  status: 'connected' | 'disconnected'
  config: Record<string, unknown> | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface ConnectorCredentials {
  id: string
  integration_id: string
  encrypted_credentials: Record<string, unknown>
  scopes: string[] | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface DecryptedCredentials {
  apiKey?: string
  apiSecret?: string
  accessToken?: string
  refreshToken?: string
  baseUrl?: string
  [key: string]: unknown
}

// ============================================
// CONNECTOR ERROR TYPES (per OpenAPI ApiError)
// ============================================

export type ConnectorErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN_ERROR'
  | 'MISSING_CREDENTIALS'
  | 'INTERNAL_ERROR'

export interface ConnectorErrorDetails {
  [field: string]: string[]
}

export interface ConnectorError extends Error {
  status: number
  code: ConnectorErrorCode
  details?: ConnectorErrorDetails
  retryAfter?: number
  provider: string
  integrationId: string
}
