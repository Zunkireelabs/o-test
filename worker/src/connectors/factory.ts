/**
 * Connector Factory for Worker
 *
 * Central factory for instantiating connectors based on provider type.
 * Handles fetching integration config and credentials from database.
 *
 * SECURITY:
 * - Credentials are stored encrypted in connector_credentials table
 * - Decryption occurs ONLY here when building connector instances
 * - This is the ONLY place where decrypted credentials exist in memory
 */

import { getSupabaseClient } from '../db'
import type {
  CRMConnector,
  ConnectorIntegration,
  ConnectorCredentials,
  DecryptedCredentials,
} from './types'
import { GenXcrmConnector } from './crm/GenXcrmConnector'
import { decryptCredentialsFromStorage } from '../security/crypto'

// ============================================
// CREDENTIAL DECRYPTION
// ============================================

/**
 * Decrypt credentials from storage.
 * Uses AES-256-GCM encryption via the security/crypto module.
 *
 * @param encryptedCredentials - Encrypted credentials from DB
 * @returns Decrypted credentials
 */
function decryptCredentials(
  encryptedCredentials: Record<string, unknown> | string
): DecryptedCredentials {
  try {
    const decrypted = decryptCredentialsFromStorage(encryptedCredentials)
    return decrypted as DecryptedCredentials
  } catch (error) {
    console.error('[ConnectorFactory] Failed to decrypt credentials:', error)
    throw new Error('Failed to decrypt connector credentials')
  }
}

// ============================================
// FETCH INTEGRATION & CREDENTIALS
// ============================================

async function fetchIntegration(
  integrationId: string
): Promise<ConnectorIntegration | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('connector_integrations')
    .select('*')
    .eq('id', integrationId)
    .single()

  if (error) {
    console.error('[ConnectorFactory] Error fetching integration:', error)
    return null
  }

  return data as ConnectorIntegration
}

async function fetchCredentials(
  integrationId: string
): Promise<DecryptedCredentials | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('connector_credentials')
    .select('*')
    .eq('integration_id', integrationId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('[ConnectorFactory] Error fetching credentials:', error)
    return null
  }

  const credentials = data as ConnectorCredentials
  return decryptCredentials(credentials.encrypted_credentials)
}

// ============================================
// CONNECTOR FACTORY
// ============================================

/**
 * Get a CRM connector instance for a given integration
 */
export async function getCRMConnector(
  providerType: string,
  integrationId: string
): Promise<CRMConnector | null> {
  const integration = await fetchIntegration(integrationId)

  if (!integration) {
    console.error(`[ConnectorFactory] Integration not found: ${integrationId}`)
    return null
  }

  if (integration.status !== 'connected') {
    console.error(
      `[ConnectorFactory] Integration ${integrationId} is not connected (status: ${integration.status})`
    )
    return null
  }

  if (integration.provider_type !== providerType) {
    console.error(
      `[ConnectorFactory] Integration ${integrationId} is not of type ${providerType} (actual: ${integration.provider_type})`
    )
    return null
  }

  const credentials = await fetchCredentials(integrationId)

  switch (providerType) {
    case 'genxcrm':
      return new GenXcrmConnector(integrationId, integration.config, credentials)

    // Future connectors:
    // case 'hubspot':
    //   return new HubspotConnector(integrationId, integration.config, credentials)
    // case 'salesforce':
    //   return new SalesforceConnector(integrationId, integration.config, credentials)

    default:
      console.error(`[ConnectorFactory] Unsupported CRM provider: ${providerType}`)
      return null
  }
}

/**
 * Get the primary integration for a tenant and provider type
 */
export async function getPrimaryIntegrationId(
  tenantId: string,
  providerType: string
): Promise<string | null> {
  const supabase = getSupabaseClient()

  // Try RPC first
  const { data, error } = await supabase.rpc('get_primary_integration', {
    p_tenant_id: tenantId,
    p_provider_type: providerType,
  })

  if (error) {
    // Fallback to manual query if RPC doesn't exist yet
    console.warn('[ConnectorFactory] RPC not available, using fallback query')

    const { data: fallbackData, error: fallbackError } = await supabase
      .from('connector_integrations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('provider_type', providerType)
      .eq('status', 'connected')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (fallbackError) {
      console.error('[ConnectorFactory] Error getting primary integration:', fallbackError)
      return null
    }

    return fallbackData?.id || null
  }

  return data as string | null
}

/**
 * List all connected integrations for a tenant
 */
export async function listIntegrations(
  tenantId: string,
  providerType?: string
): Promise<ConnectorIntegration[]> {
  const supabase = getSupabaseClient()

  let query = supabase
    .from('connector_integrations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'connected')
    .order('created_at', { ascending: true })

  if (providerType) {
    query = query.eq('provider_type', providerType)
  }

  const { data, error } = await query

  if (error) {
    console.error('[ConnectorFactory] Error listing integrations:', error)
    return []
  }

  return (data || []) as ConnectorIntegration[]
}
