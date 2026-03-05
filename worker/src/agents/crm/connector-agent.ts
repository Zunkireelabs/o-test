/**
 * CRM Connector Agent
 *
 * Handles CRM-related events and interacts with external CRM systems
 * through the connector abstraction layer.
 *
 * ARCHITECTURAL INVARIANT:
 * - This agent NEVER writes directly to DB tables
 * - All persistence is done via event emission → projection layer
 *
 * Subscribes to:
 * - crm.get_leads_requested
 * - crm.create_lead_requested
 * - crm.update_lead_requested
 * - crm.move_stage_requested
 * - crm.assign_requested
 * - crm.lead_created (from webhooks)
 * - crm.lead_updated (from webhooks)
 *
 * Emits:
 * - crm.leads_fetched
 * - crm.lead_created
 * - crm.lead_updated
 * - crm.operation_failed
 * - lead.persist_requested (for projection layer)
 */

import type { Agent, EventRecord, EmittedEvent } from '../../types'
import {
  getCRMConnector,
  getPrimaryIntegrationId,
} from '../../connectors'
import type { CRMConnector } from '../../connectors/types'

export class CrmConnectorAgent implements Agent {
  name = 'CrmConnectorAgent'

  subscribe(): string[] {
    return [
      'crm.get_leads_requested',
      'crm.create_lead_requested',
      'crm.update_lead_requested',
      'crm.move_stage_requested',
      'crm.assign_requested',
      'crm.lead_created', // From webhooks
      'crm.lead_updated', // From webhooks
    ]
  }

  async handle(event: EventRecord): Promise<EmittedEvent[]> {
    console.log(`[${this.name}] Handling event: ${event.event_type}`)

    switch (event.event_type) {
      case 'crm.get_leads_requested':
        return this.handleGetLeads(event)

      case 'crm.create_lead_requested':
        return this.handleCreateLead(event)

      case 'crm.update_lead_requested':
        return this.handleUpdateLead(event)

      case 'crm.move_stage_requested':
        return this.handleMoveStage(event)

      case 'crm.assign_requested':
        return this.handleAssign(event)

      case 'crm.lead_created':
        return this.handleLeadCreatedWebhook(event)

      case 'crm.lead_updated':
        return this.handleLeadUpdatedWebhook(event)

      default:
        console.log(`[${this.name}] Unhandled event type: ${event.event_type}`)
        return []
    }
  }

  // ============================================
  // GET LEADS
  // ============================================

  private async handleGetLeads(event: EventRecord): Promise<EmittedEvent[]> {
    const payload = event.payload as {
      provider?: string
      filters?: {
        stage_id?: string
        assigned_to?: string
        search?: string
        limit?: number
        offset?: number
      }
    }

    const provider = payload.provider || 'genxcrm'

    try {
      const connector = await this.getConnector(event.tenant_id, provider)

      if (!connector) {
        return [
          {
            event_type: 'crm.operation_failed',
            payload: {
              operation: 'get_leads',
              provider,
              error: `No connected ${provider} integration found`,
              original_event_id: event.id,
            },
          },
        ]
      }

      const result = await connector.getLeads(payload.filters)

      console.log(`[${this.name}] Fetched ${result.leads.length} of ${result.total} leads from ${provider}`)

      return [
        {
          event_type: 'crm.leads_fetched',
          payload: {
            provider,
            leads: result.leads,
            total: result.total,
            count: result.leads.length,
            filters: payload.filters,
            fetched_at: new Date().toISOString(),
          },
        },
      ]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[${this.name}] Error fetching leads:`, errorMessage)

      return [
        {
          event_type: 'crm.operation_failed',
          payload: {
            operation: 'get_leads',
            provider,
            error: errorMessage,
            original_event_id: event.id,
          },
        },
      ]
    }
  }

  // ============================================
  // CREATE LEAD
  // ============================================

  private async handleCreateLead(event: EventRecord): Promise<EmittedEvent[]> {
    const payload = event.payload as {
      provider?: string
      lead_data: {
        first_name: string
        email: string
        last_name?: string
        phone?: string
        city?: string
        country?: string
        stage_id?: string
        status?: string
        custom_fields?: Record<string, unknown>
        intake_source?: string
        intake_campaign?: string
      }
    }

    const provider = payload.provider || 'genxcrm'
    const leadData = payload.lead_data

    if (!leadData?.email || !leadData?.first_name) {
      return [
        {
          event_type: 'crm.operation_failed',
          payload: {
            operation: 'create_lead',
            provider,
            error: 'Missing required fields: first_name and email are required',
            original_event_id: event.id,
          },
        },
      ]
    }

    try {
      const connector = await this.getConnector(event.tenant_id, provider)

      if (!connector) {
        return [
          {
            event_type: 'crm.operation_failed',
            payload: {
              operation: 'create_lead',
              provider,
              error: `No connected ${provider} integration found`,
              original_event_id: event.id,
            },
          },
        ]
      }

      const createdLead = await connector.createLead(leadData)

      console.log(`[${this.name}] Created lead in ${provider}: ${createdLead.id}`)

      // Emit events: one for downstream processing, one for persistence
      // Persistence is handled by projection layer (NOT direct DB write)
      // NOTE: We do NOT mirror CRM fields locally - only store reference
      return [
        {
          event_type: 'crm.lead_created',
          payload: {
            provider,
            lead: createdLead,
            external_id: createdLead.id,
            source: 'chat',
            created_at: new Date().toISOString(),
          },
        },
        {
          event_type: 'lead.persist_requested',
          payload: {
            tenant_id: event.tenant_id,
            project_id: event.project_id,
            provider,
            external_id: createdLead.id,
            last_action: 'created',
            metadata: {
              email: createdLead.email,
              source: 'chat',
              created_at: new Date().toISOString(),
            },
          },
        },
      ]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[${this.name}] Error creating lead:`, errorMessage)

      return [
        {
          event_type: 'crm.operation_failed',
          payload: {
            operation: 'create_lead',
            provider,
            error: errorMessage,
            lead_data: leadData,
            original_event_id: event.id,
          },
        },
      ]
    }
  }

  // ============================================
  // UPDATE LEAD
  // ============================================

  private async handleUpdateLead(event: EventRecord): Promise<EmittedEvent[]> {
    const payload = event.payload as {
      provider?: string
      lead_id: string
      update_data: {
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
      }
    }

    const provider = payload.provider || 'genxcrm'
    const leadId = payload.lead_id
    const updateData = payload.update_data

    if (!leadId) {
      return [
        {
          event_type: 'crm.operation_failed',
          payload: {
            operation: 'update_lead',
            provider,
            error: 'Missing required field: lead_id',
            original_event_id: event.id,
          },
        },
      ]
    }

    try {
      const connector = await this.getConnector(event.tenant_id, provider)

      if (!connector) {
        return [
          {
            event_type: 'crm.operation_failed',
            payload: {
              operation: 'update_lead',
              provider,
              error: `No connected ${provider} integration found`,
              original_event_id: event.id,
            },
          },
        ]
      }

      const updatedLead = await connector.updateLead(leadId, updateData)

      console.log(`[${this.name}] Updated lead in ${provider}: ${leadId}`)

      return [
        {
          event_type: 'crm.lead_updated',
          payload: {
            provider,
            lead: updatedLead,
            external_id: leadId,
            changes: updateData,
            source: 'chat',
            updated_at: new Date().toISOString(),
          },
        },
      ]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[${this.name}] Error updating lead:`, errorMessage)

      return [
        {
          event_type: 'crm.operation_failed',
          payload: {
            operation: 'update_lead',
            provider,
            error: errorMessage,
            lead_id: leadId,
            update_data: updateData,
            original_event_id: event.id,
          },
        },
      ]
    }
  }

  // ============================================
  // MOVE STAGE
  // ============================================

  private async handleMoveStage(event: EventRecord): Promise<EmittedEvent[]> {
    const payload = event.payload as {
      provider?: string
      leadId: string
      stageId: string
    }

    const provider = payload.provider || 'genxcrm'
    const { leadId, stageId } = payload

    const connector = await this.getConnector(event.tenant_id, provider)

    if (!connector) {
      throw new Error(`No connected ${provider} integration found for tenant ${event.tenant_id}`)
    }

    const updatedLead = await connector.moveStage(leadId, stageId, event.idempotency_key)

    console.log(`[${this.name}] Moved lead ${leadId} to stage ${stageId} in ${provider}`)

    // NOTE: We do NOT mirror CRM fields locally - only store reference
    return [
      {
        event_type: 'crm.lead_updated',
        payload: {
          provider,
          lead: updatedLead,
          external_id: leadId,
          changes: { stage_id: stageId },
          source: 'move_stage',
          updated_at: new Date().toISOString(),
        },
      },
      {
        event_type: 'lead.persist_requested',
        payload: {
          tenant_id: event.tenant_id,
          project_id: event.project_id,
          provider,
          external_id: updatedLead.id,
          last_action: 'move_stage',
          metadata: {
            stage_id: stageId,
            updated_at: new Date().toISOString(),
          },
        },
      },
    ]
  }

  // ============================================
  // ASSIGN LEAD
  // ============================================

  private async handleAssign(event: EventRecord): Promise<EmittedEvent[]> {
    const payload = event.payload as {
      provider?: string
      leadId: string
      userId: string
    }

    const provider = payload.provider || 'genxcrm'
    const { leadId, userId } = payload

    const connector = await this.getConnector(event.tenant_id, provider)

    if (!connector) {
      throw new Error(`No connected ${provider} integration found for tenant ${event.tenant_id}`)
    }

    const updatedLead = await connector.assignLead(leadId, userId, event.idempotency_key)

    console.log(`[${this.name}] Assigned lead ${leadId} to user ${userId} in ${provider}`)

    // NOTE: We do NOT mirror CRM fields locally - only store reference
    return [
      {
        event_type: 'crm.lead_updated',
        payload: {
          provider,
          lead: updatedLead,
          external_id: leadId,
          changes: { assigned_to: userId },
          source: 'assign',
          updated_at: new Date().toISOString(),
        },
      },
      {
        event_type: 'lead.persist_requested',
        payload: {
          tenant_id: event.tenant_id,
          project_id: event.project_id,
          provider,
          external_id: updatedLead.id,
          last_action: 'assign',
          metadata: {
            assigned_to: userId,
            updated_at: new Date().toISOString(),
          },
        },
      },
    ]
  }

  // ============================================
  // WEBHOOK HANDLERS
  // ============================================

  private async handleLeadCreatedWebhook(event: EventRecord): Promise<EmittedEvent[]> {
    const payload = event.payload as {
      external_id?: string
      email?: string
      first_name?: string
      last_name?: string
      phone?: string
      city?: string
      country?: string
      status?: string
      stage_id?: string
      stage_name?: string
      intake_source?: string
      webhook_metadata?: {
        provider?: string
      }
    }

    const provider = payload.webhook_metadata?.provider || 'unknown'

    console.log(`[${this.name}] Processing webhook lead created from ${provider}`)

    if (!payload.external_id) {
      console.log(`[${this.name}] Skipping webhook - no external_id in payload`)
      return []
    }

    // Emit lead.persist_requested for projection layer
    // NO direct DB writes - projection handles persistence
    // NOTE: We do NOT mirror CRM fields locally - only store reference
    return [
      {
        event_type: 'lead.persist_requested',
        payload: {
          tenant_id: event.tenant_id,
          project_id: event.project_id,
          provider,
          external_id: payload.external_id,
          last_action: 'webhook_created',
          metadata: {
            email: payload.email,
            received_at: new Date().toISOString(),
          },
        },
      },
    ]
  }

  private async handleLeadUpdatedWebhook(event: EventRecord): Promise<EmittedEvent[]> {
    const payload = event.payload as {
      external_id?: string
      email?: string
      changes?: Record<string, unknown>
      webhook_metadata?: {
        provider?: string
      }
    }

    const provider = payload.webhook_metadata?.provider || 'unknown'

    console.log(`[${this.name}] Processing webhook lead updated from ${provider}`)

    // Log the update - projection layer handles local state updates
    return []
  }

  // ============================================
  // HELPERS
  // ============================================

  private async getConnector(
    tenantId: string,
    provider: string
  ): Promise<CRMConnector | null> {
    // Get the primary integration for this tenant and provider
    const integrationId = await getPrimaryIntegrationId(tenantId, provider)

    if (!integrationId) {
      console.log(`[${this.name}] No integration found for tenant ${tenantId} and provider ${provider}`)
      return null
    }

    return getCRMConnector(provider, integrationId)
  }
}
