'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Loader2, Plus, CheckCircle, AlertCircle, MoreHorizontal, Eye, Unlink } from 'lucide-react'
import { useTenant } from '@/hooks/useTenant'
import {
  IntegrationDetailsModal,
  type IntegrationDetails,
} from '@/components/features/integration-details-modal'
import {
  type ConnectorIntegrationPublic,
  type ConnectorErrorCode,
  CONNECTOR_ERROR_CODES,
  PROVIDER_DEFAULTS,
} from '@/types/connectors'

// ============================================
// ERROR MESSAGES
// ============================================

const ERROR_MESSAGES: Record<ConnectorErrorCode, string> = {
  [CONNECTOR_ERROR_CODES.INVALID_API_KEY]: 'Invalid API key. Please check your credentials.',
  [CONNECTOR_ERROR_CODES.PROVIDER_RATE_LIMITED]: 'Rate limit exceeded. Please wait and try again.',
  [CONNECTOR_ERROR_CODES.PROVIDER_UNAVAILABLE]: 'GenXCRM is temporarily unavailable.',
  [CONNECTOR_ERROR_CODES.PROVIDER_UNREACHABLE]: 'Cannot reach GenXCRM. Check your network or base URL.',
  [CONNECTOR_ERROR_CODES.PROVIDER_NOT_IMPLEMENTED]: 'This provider is not yet supported.',
  [CONNECTOR_ERROR_CODES.UNAUTHORIZED]: 'You must be logged in.',
  [CONNECTOR_ERROR_CODES.FORBIDDEN]: 'You need admin permissions to manage integrations.',
  [CONNECTOR_ERROR_CODES.VALIDATION_ERROR]: 'Invalid request. Please check your inputs.',
  [CONNECTOR_ERROR_CODES.ENCRYPTION_ERROR]: 'Server configuration error. Contact support.',
  [CONNECTOR_ERROR_CODES.NOT_FOUND]: 'Integration not found.',
}

// ============================================
// CONNECTION STATES
// ============================================

type ConnectionState = 'not_connected' | 'connecting' | 'connected' | 'disconnecting' | 'error'

// ============================================
// AVAILABLE ACTIONS FOR GENXCRM
// ============================================

const GENXCRM_ACTIONS = ['create_lead', 'update_lead', 'get_leads', 'get_lead_by_id', 'delete_lead']

// ============================================
// COMPONENT
// ============================================

interface CrmConnectorCardProps {
  onConnectionChange?: (connected: boolean) => void
}

export function CrmConnectorCard({ onConnectionChange }: CrmConnectorCardProps) {
  const { isAdmin } = useTenant()

  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>('not_connected')
  const [integration, setIntegration] = useState<ConnectorIntegrationPublic | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState<string>(PROVIDER_DEFAULTS.genxcrm.base_url)
  const [error, setError] = useState<{ code: ConnectorErrorCode; message: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // ============================================
  // LOAD EXISTING INTEGRATION
  // ============================================

  useEffect(() => {
    async function loadIntegration() {
      setLoading(true)
      try {
        const res = await fetch('/api/connectors/list?provider_type=genxcrm')
        if (!res.ok) {
          throw new Error('Failed to load')
        }

        const data = await res.json()
        if (!data.success) {
          throw new Error(data.error)
        }

        const primary = data.integrations.find((i: ConnectorIntegrationPublic) => i.is_primary)

        if (primary) {
          setIntegration(primary)
          setConnectionState(primary.status === 'connected' ? 'connected' : 'not_connected')
          // Pre-fill base URL from config if available
          if (primary.config?.base_url) {
            setBaseUrl(primary.config.base_url)
          }
        }
      } catch (err) {
        console.error('[CrmConnectorCard] Failed to load integration:', err)
      } finally {
        setLoading(false)
      }
    }

    loadIntegration()
  }, [])

  // ============================================
  // VALIDATE BASE URL
  // ============================================

  const isValidBaseUrl = (url: string): boolean => {
    if (!url.trim()) return true // Empty means use default
    return url.trim().startsWith('https://') || url.trim().startsWith('http://')
  }

  // ============================================
  // CONNECT HANDLER
  // ============================================

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setError({
        code: CONNECTOR_ERROR_CODES.VALIDATION_ERROR,
        message: 'API key is required',
      })
      return
    }

    if (!isValidBaseUrl(baseUrl)) {
      setError({
        code: CONNECTOR_ERROR_CODES.VALIDATION_ERROR,
        message: 'Base URL must start with https://',
      })
      return
    }

    setConnectionState('connecting')
    setError(null)

    try {
      const res = await fetch('/api/connectors/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_type: 'genxcrm',
          credentials: {
            api_key: apiKey,
            base_url: baseUrl || PROVIDER_DEFAULTS.genxcrm.base_url,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setConnectionState('error')
        const errorCode = data.error as ConnectorErrorCode
        setError({
          code: errorCode,
          message: ERROR_MESSAGES[errorCode] || data.message || 'Failed to connect',
        })
        return
      }

      // Success
      setConnectionState('connected')
      setIntegration({
        provider_type: 'genxcrm',
        status: 'connected',
        is_primary: true,
        config: { base_url: baseUrl || PROVIDER_DEFAULTS.genxcrm.base_url },
        created_at: new Date().toISOString(),
      })
      setApiKey('') // Clear API key from memory
      setShowConnectDialog(false)
      onConnectionChange?.(true)
    } catch {
      setConnectionState('error')
      setError({
        code: CONNECTOR_ERROR_CODES.VALIDATION_ERROR,
        message: 'Failed to connect. Please try again.',
      })
    }
  }

  // ============================================
  // DISCONNECT HANDLER
  // ============================================

  const handleDisconnect = async () => {
    setConnectionState('disconnecting')
    setError(null)
    setShowDetailsModal(false)

    try {
      const res = await fetch('/api/connectors/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_type: 'genxcrm' }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setConnectionState('connected') // Revert
        const errorCode = data.error as ConnectorErrorCode
        setError({
          code: errorCode,
          message: ERROR_MESSAGES[errorCode] || data.message || 'Failed to disconnect',
        })
        return
      }

      setConnectionState('not_connected')
      setIntegration((prev) => (prev ? { ...prev, status: 'disconnected' } : null))
      onConnectionChange?.(false)
    } catch {
      setConnectionState('connected') // Revert
      setError({
        code: CONNECTOR_ERROR_CODES.VALIDATION_ERROR,
        message: 'Failed to disconnect. Please try again.',
      })
    }
  }

  // ============================================
  // BUILD DETAILS FOR MODAL
  // ============================================

  const integrationDetails: IntegrationDetails = {
    id: 'genxcrm',
    name: PROVIDER_DEFAULTS.genxcrm.display_name,
    description: 'CRM Integration for lead management',
    longDescription:
      'Connect GenXCRM to Orca to manage leads, sync contacts, and automate your CRM workflows. Create, update, and track leads directly from your Orca workspace using natural language commands.',
    icon: (
      <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
        GX
      </div>
    ),
    category: 'CRM & Sales',
    connected: connectionState === 'connected',
    connectionInfo: integration
      ? {
          baseUrl: integration.config?.base_url || PROVIDER_DEFAULTS.genxcrm.base_url,
          connectedAt: integration.created_at,
          status: integration.status as 'connected' | 'disconnected',
        }
      : undefined,
    actions: GENXCRM_ACTIONS,
    developer: 'Orca',
  }

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <Card className="shadow-none">
        <CardContent className="p-4 flex items-center justify-center h-[72px]">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const isConnecting = connectionState === 'connecting'
  const isDisconnecting = connectionState === 'disconnecting'
  const isConnected = connectionState === 'connected'

  return (
    <>
      <Card className="shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
              GX
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground tracking-[-0.01em]">
                  {PROVIDER_DEFAULTS.genxcrm.display_name}
                </h3>
                {isConnected && (
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs font-medium">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground tracking-[-0.01em] truncate">
                CRM Integration for lead management
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isConnected ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowDetailsModal(true)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View details
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem
                        onClick={handleDisconnect}
                        className="text-red-600 focus:text-red-600"
                        disabled={isDisconnecting}
                      >
                        <Unlink className="w-4 h-4 mr-2" />
                        {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => setShowConnectDialog(true)}
                  disabled={!isAdmin}
                  title={isAdmin ? 'Connect' : 'Contact admin to connect'}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                GX
              </div>
              Connect {PROVIDER_DEFAULTS.genxcrm.display_name}
            </DialogTitle>
            <DialogDescription>
              Enter your GenXCRM API credentials to connect.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error.message}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="genxcrm-api-key" className="text-sm">
                API Key
              </Label>
              <Input
                id="genxcrm-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="Enter your GenXCRM API key"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="genxcrm-base-url" className="text-sm">
                Base URL
              </Label>
              <Input
                id="genxcrm-base-url"
                type="url"
                value={baseUrl}
                onChange={(e) => {
                  setBaseUrl(e.target.value)
                  if (error) setError(null)
                }}
                placeholder={PROVIDER_DEFAULTS.genxcrm.base_url}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Default: {PROVIDER_DEFAULTS.genxcrm.base_url}
              </p>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting || !apiKey.trim()}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <IntegrationDetailsModal
        integration={integrationDetails}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        onDisconnect={handleDisconnect}
        loading={isDisconnecting}
      />
    </>
  )
}
