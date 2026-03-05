/**
 * GenXcrm Connector - Production Implementation
 *
 * Strictly aligned with GenXcrm OpenAPI 3.0 spec.
 * Base URL: https://lead-crm.zunkireelabs.com
 * Routes: /api/v1/integrations/crm/*
 *
 * Features:
 * - Bearer token authentication (crm_live_...)
 * - Idempotency keys on mutations (createLead, assignLead, moveStage)
 * - Rate limit handling (120 req/min, 429 includes Retry-After)
 * - Structured error responses per OpenAPI ApiError schema
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios'
import { v4 as uuidv4 } from 'uuid'
import type {
  CRMConnector,
  CRMLead,
  CRMLeadDetail,
  CRMStage,
  PipelineGroup,
  ChecklistItem,
  LeadFilters,
  LeadListResponse,
  CreateLeadData,
  UpdateLeadData,
  DecryptedCredentials,
  ConnectorError,
  ConnectorErrorCode,
  ConnectorErrorDetails,
} from '../types'

// ============================================
// GENXCRM API RESPONSE TYPES (per OpenAPI)
// ============================================

/** GET /leads response */
interface ListLeadsApiResponse {
  data: {
    leads: CRMLead[]
    total: number
    limit: number
    offset: number
  }
}

/** GET /leads/{id} response */
interface GetLeadApiResponse {
  data: CRMLeadDetail
}

/** POST /leads, PATCH /leads/{id}, POST /leads/{id}/assign, POST /leads/{id}/move-stage response */
interface LeadApiResponse {
  data: CRMLead
}

/** GET /stages response */
interface StagesApiResponse {
  data: CRMStage[]
}

/** GET /pipeline response */
interface PipelineApiResponse {
  data: PipelineGroup[]
}

/** GET /leads/{id}/checklists response */
interface ChecklistsApiResponse {
  data: ChecklistItem[]
}

/** Error response per OpenAPI ApiError schema */
interface GenXcrmErrorBody {
  error: {
    code: string
    message: string
    details?: ConnectorErrorDetails
  }
}

// ============================================
// ERROR HANDLING
// ============================================

function createConnectorError(
  message: string,
  status: number,
  code: ConnectorErrorCode,
  integrationId: string,
  details?: ConnectorErrorDetails,
  retryAfter?: number
): ConnectorError {
  const error = new Error(message) as ConnectorError
  error.name = 'ConnectorError'
  error.status = status
  error.code = code
  error.details = details
  error.retryAfter = retryAfter
  error.provider = 'genxcrm'
  error.integrationId = integrationId
  return error
}

function parseGenXcrmError(
  axiosError: AxiosError<GenXcrmErrorBody>,
  integrationId: string
): ConnectorError {
  const status = axiosError.response?.status || 500
  const errorBody = axiosError.response?.data?.error

  // Extract Retry-After for 429
  let retryAfter: number | undefined
  if (status === 429) {
    const retryHeader = axiosError.response?.headers?.['retry-after']
    if (retryHeader) {
      retryAfter = parseInt(retryHeader, 10)
      if (isNaN(retryAfter)) {
        retryAfter = undefined
      }
    }
  }

  if (errorBody) {
    // Map API error code to our type
    const code = mapErrorCode(errorBody.code)
    return createConnectorError(
      errorBody.message,
      status,
      code,
      integrationId,
      errorBody.details,
      retryAfter
    )
  }

  // Fallback for non-standard error responses
  return createConnectorError(
    axiosError.message || 'Unknown GenXcrm API error',
    status,
    'UNKNOWN_ERROR',
    integrationId,
    undefined,
    retryAfter
  )
}

function mapErrorCode(apiCode: string): ConnectorErrorCode {
  const validCodes: ConnectorErrorCode[] = [
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'VALIDATION_ERROR',
    'CONFLICT',
    'RATE_LIMITED',
    'SERVICE_UNAVAILABLE',
  ]
  if (validCodes.includes(apiCode as ConnectorErrorCode)) {
    return apiCode as ConnectorErrorCode
  }
  return 'UNKNOWN_ERROR'
}

// ============================================
// GENXCRM CONNECTOR CLASS
// ============================================

export class GenXcrmConnector implements CRMConnector {
  readonly providerType = 'genxcrm'
  readonly integrationId: string

  private client: AxiosInstance

  constructor(
    integrationId: string,
    config: Record<string, unknown> | null,
    credentials: DecryptedCredentials | null
  ) {
    this.integrationId = integrationId

    // Validate API key
    const apiKey = credentials?.apiKey as string | undefined
    if (!apiKey) {
      throw createConnectorError(
        'GenXcrm API key is required',
        401,
        'MISSING_CREDENTIALS',
        integrationId
      )
    }

    // Build base URL
    const baseUrl = (config?.baseUrl as string) || 'https://lead-crm.zunkireelabs.com'

    // Initialize axios client
    this.client = axios.create({
      baseURL: `${baseUrl}/api/v1/integrations/crm`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    })

    console.log(`[GenXcrmConnector] Initialized for integration: ${integrationId}`)
  }

  // ============================================
  // LEAD METHODS
  // ============================================

  /**
   * List leads with optional filtering and pagination.
   * GET /leads
   */
  async getLeads(filters?: LeadFilters): Promise<LeadListResponse> {
    console.log(`[GenXcrmConnector] getLeads`, {
      integrationId: this.integrationId,
      filters: filters ? { ...filters } : undefined,
    })

    try {
      const params: Record<string, string | number> = {}

      // Only use supported query params per OpenAPI spec
      if (filters?.stage_id) params.stage_id = filters.stage_id
      if (filters?.assigned_to) params.assigned_to = filters.assigned_to
      if (filters?.search) params.search = filters.search
      if (filters?.limit !== undefined) params.limit = filters.limit
      if (filters?.offset !== undefined) params.offset = filters.offset

      const response: AxiosResponse<ListLeadsApiResponse> = await this.client.get('/leads', {
        params,
      })

      const result = response.data.data
      console.log(`[GenXcrmConnector] Retrieved ${result.leads.length} of ${result.total} leads`)
      return result
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get a single lead by ID with checklist summary.
   * GET /leads/{id}
   */
  async getLeadById(id: string): Promise<CRMLeadDetail | null> {
    console.log(`[GenXcrmConnector] getLeadById`, { integrationId: this.integrationId, id })

    try {
      const response: AxiosResponse<GetLeadApiResponse> = await this.client.get(`/leads/${id}`)

      const lead = response.data.data
      console.log(`[GenXcrmConnector] Retrieved lead: ${id}`)
      return lead
    } catch (error) {
      // Return null for 404 per interface contract
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log(`[GenXcrmConnector] Lead not found: ${id}`)
        return null
      }
      throw this.handleError(error)
    }
  }

  /**
   * Create a new lead.
   * POST /leads
   */
  async createLead(data: CreateLeadData, idempotencyKey?: string): Promise<CRMLead> {
    const key = idempotencyKey || uuidv4()
    console.log(`[GenXcrmConnector] createLead`, {
      integrationId: this.integrationId,
      idempotencyKey: key,
      // Do not log PII fields
    })

    try {
      const response: AxiosResponse<LeadApiResponse> = await this.client.post('/leads', data, {
        headers: {
          'Idempotency-Key': key,
        },
      })

      const lead = response.data.data
      console.log(`[GenXcrmConnector] Created lead: ${lead.id}`)
      return lead
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Partial update of a lead.
   * PATCH /leads/{id}
   */
  async updateLead(id: string, data: UpdateLeadData): Promise<CRMLead> {
    console.log(`[GenXcrmConnector] updateLead`, {
      integrationId: this.integrationId,
      leadId: id,
      // Do not log PII fields
    })

    try {
      const response: AxiosResponse<LeadApiResponse> = await this.client.patch(`/leads/${id}`, data)

      const lead = response.data.data
      console.log(`[GenXcrmConnector] Updated lead: ${id}`)
      return lead
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Assign lead to a team member.
   * POST /leads/{id}/assign
   */
  async assignLead(id: string, userId: string, idempotencyKey?: string): Promise<CRMLead> {
    const key = idempotencyKey || uuidv4()
    console.log(`[GenXcrmConnector] assignLead`, {
      integrationId: this.integrationId,
      leadId: id,
      userId,
      idempotencyKey: key,
    })

    try {
      const response: AxiosResponse<LeadApiResponse> = await this.client.post(
        `/leads/${id}/assign`,
        { user_id: userId },
        {
          headers: {
            'Idempotency-Key': key,
          },
        }
      )

      const lead = response.data.data
      console.log(`[GenXcrmConnector] Assigned lead ${id} to user ${userId}`)
      return lead
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Move lead to another pipeline stage.
   * POST /leads/{id}/move-stage
   */
  async moveStage(id: string, stageId: string, idempotencyKey?: string): Promise<CRMLead> {
    const key = idempotencyKey || uuidv4()
    console.log(`[GenXcrmConnector] moveStage`, {
      integrationId: this.integrationId,
      leadId: id,
      stageId,
      idempotencyKey: key,
    })

    try {
      const response: AxiosResponse<LeadApiResponse> = await this.client.post(
        `/leads/${id}/move-stage`,
        { stage_id: stageId },
        {
          headers: {
            'Idempotency-Key': key,
          },
        }
      )

      const lead = response.data.data
      console.log(`[GenXcrmConnector] Moved lead ${id} to stage ${stageId}`)
      return lead
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // ============================================
  // STAGE & PIPELINE METHODS
  // ============================================

  /**
   * List all pipeline stages.
   * GET /stages
   */
  async listStages(): Promise<CRMStage[]> {
    console.log(`[GenXcrmConnector] listStages`, { integrationId: this.integrationId })

    try {
      const response: AxiosResponse<StagesApiResponse> = await this.client.get('/stages')

      const stages = response.data.data
      console.log(`[GenXcrmConnector] Retrieved ${stages.length} stages`)
      return stages
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get pipeline view with stages and grouped leads.
   * GET /pipeline
   */
  async getPipeline(): Promise<PipelineGroup[]> {
    console.log(`[GenXcrmConnector] getPipeline`, { integrationId: this.integrationId })

    try {
      const response: AxiosResponse<PipelineApiResponse> = await this.client.get('/pipeline')

      const groups = response.data.data
      console.log(`[GenXcrmConnector] Retrieved pipeline with ${groups.length} stage groups`)
      return groups
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // ============================================
  // CHECKLIST METHODS
  // ============================================

  /**
   * Get checklist items for a lead.
   * GET /leads/{id}/checklists
   */
  async getChecklists(leadId: string): Promise<ChecklistItem[]> {
    console.log(`[GenXcrmConnector] getChecklists`, {
      integrationId: this.integrationId,
      leadId,
    })

    try {
      const response: AxiosResponse<ChecklistsApiResponse> = await this.client.get(
        `/leads/${leadId}/checklists`
      )

      const items = response.data.data
      console.log(`[GenXcrmConnector] Retrieved ${items.length} checklist items for lead ${leadId}`)
      return items
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // ============================================
  // ERROR HANDLING
  // ============================================

  private handleError(error: unknown): ConnectorError {
    if (axios.isAxiosError(error)) {
      const connectorError = parseGenXcrmError(
        error as AxiosError<GenXcrmErrorBody>,
        this.integrationId
      )

      console.error(`[GenXcrmConnector] API Error`, {
        integrationId: this.integrationId,
        status: connectorError.status,
        code: connectorError.code,
        message: connectorError.message,
        retryAfter: connectorError.retryAfter,
      })

      return connectorError
    }

    // Non-Axios error (network, timeout, etc.)
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[GenXcrmConnector] Non-API Error`, {
      integrationId: this.integrationId,
      message,
    })

    return createConnectorError(message, 500, 'INTERNAL_ERROR', this.integrationId)
  }
}
