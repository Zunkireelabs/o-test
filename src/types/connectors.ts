/**
 * Connector Integration Types
 *
 * Type definitions for the generic connector integration layer.
 * Used by API routes and frontend components.
 */

// ============================================
// ERROR CODES
// ============================================

export const CONNECTOR_ERROR_CODES = {
  // Provider validation errors
  INVALID_API_KEY: 'INVALID_API_KEY',
  PROVIDER_RATE_LIMITED: 'PROVIDER_RATE_LIMITED',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  PROVIDER_UNREACHABLE: 'PROVIDER_UNREACHABLE',
  PROVIDER_NOT_IMPLEMENTED: 'PROVIDER_NOT_IMPLEMENTED',

  // Auth/permission errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Request errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  ENCRYPTION_ERROR: 'ENCRYPTION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
} as const

export type ConnectorErrorCode = (typeof CONNECTOR_ERROR_CODES)[keyof typeof CONNECTOR_ERROR_CODES]

// ============================================
// SUPPORTED PROVIDERS
// ============================================

export const SUPPORTED_PROVIDERS = ['genxcrm'] as const
export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number]

/**
 * Type guard to check if a provider is supported
 */
export function isSupportedProvider(provider: string): provider is SupportedProvider {
  return SUPPORTED_PROVIDERS.includes(provider as SupportedProvider)
}

/**
 * Normalize provider type for consistent storage/lookup
 */
export function normalizeProviderType(provider: string | undefined | null): string {
  if (!provider) return ''
  return provider.toLowerCase().trim()
}

// ============================================
// BASE URL SANITIZATION
// ============================================

/**
 * Sanitize base URL to enforce https:// and remove trailing slash
 */
export function sanitizeBaseUrl(url: string | undefined | null, defaultUrl: string): string {
  if (!url) return defaultUrl

  let sanitized = url.trim()

  // Enforce HTTPS
  if (!sanitized.startsWith('https://')) {
    if (sanitized.startsWith('http://')) {
      sanitized = sanitized.replace('http://', 'https://')
    } else {
      sanitized = 'https://' + sanitized
    }
  }

  // Remove trailing slashes
  return sanitized.replace(/\/+$/, '')
}

// ============================================
// PROVIDER VALIDATION TYPES
// ============================================

export interface ProviderValidationResult {
  valid: boolean
  error_code?: ConnectorErrorCode
  message?: string
}

export type ProviderValidator = (credentials: {
  api_key: string
  base_url?: string
}) => Promise<ProviderValidationResult>

// ============================================
// API REQUEST TYPES
// ============================================

/**
 * Request body for POST /api/connectors/connect
 * NOTE: tenant_id is NEVER accepted - always derived from membership
 */
export interface ConnectRequest {
  provider_type: string
  credentials: {
    api_key: string
    base_url?: string
  }
  config?: Record<string, unknown>
}

/**
 * Request body for POST /api/connectors/disconnect
 * NOTE: tenant_id is NEVER accepted - always derived from membership
 */
export interface DisconnectRequest {
  provider_type: string
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Success response for connect route
 * NOTE: integration_id is intentionally NOT exposed
 */
export interface ConnectResponse {
  success: true
  provider: string
  status: 'connected'
}

/**
 * Success response for disconnect route
 * NOTE: integration_id is intentionally NOT exposed
 */
export interface DisconnectResponse {
  success: true
  status: 'disconnected'
}

/**
 * Public integration data returned by list route
 * NOTE: Excludes integration_id, credentials, encrypted_credentials
 */
export interface ConnectorIntegrationPublic {
  provider_type: string
  status: 'connected' | 'disconnected'
  config: {
    base_url?: string
  } | null
  is_primary: boolean
  created_at: string
}

/**
 * Success response for list route
 */
export interface ListIntegrationsResponse {
  success: true
  integrations: ConnectorIntegrationPublic[]
}

/**
 * Error response for all connector routes
 */
export interface ConnectorErrorResponse {
  success: false
  error: ConnectorErrorCode
  message?: string
}

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

export const PROVIDER_DEFAULTS = {
  genxcrm: {
    base_url: 'https://lead-crm.zunkireelabs.com',
    display_name: 'GenXCRM',
  },
} as const
