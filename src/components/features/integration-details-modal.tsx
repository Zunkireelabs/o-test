'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import { ArrowLeft, X, CheckCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IntegrationDetails {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  icon: string | React.ReactNode;
  category?: string;
  connected: boolean;
  connectionInfo?: {
    baseUrl?: string;
    connectedAt?: string;
    status?: 'connected' | 'disconnected' | 'error';
  };
  actions?: string[];
  developer?: string;
}

interface IntegrationDetailsModalProps {
  integration: IntegrationDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  loading?: boolean;
}

export function IntegrationDetailsModal({
  integration,
  open,
  onOpenChange,
  onConnect,
  onDisconnect,
  loading,
}: IntegrationDetailsModalProps) {
  if (!integration) return null;

  const isConnected = integration.connected;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0">
        {/* Header with Back and Close */}
        <DialogHeader className="p-4 pb-0 flex flex-row items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 pt-4">
          {/* Integration Header */}
          <div className="flex items-start gap-4 mb-6">
            {/* Icon */}
            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
              {typeof integration.icon === 'string' ? (
                integration.icon.startsWith('http') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={integration.icon} alt={integration.name} className="w-10 h-10" />
                ) : (
                  <span className="text-3xl">{integration.icon}</span>
                )
              ) : (
                integration.icon
              )}
            </div>

            {/* Name and Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground tracking-[-0.02em]">
                  {integration.name}
                </h2>
                {isConnected && (
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs font-medium">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 tracking-[-0.01em]">
                {integration.description}
              </p>
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              {isConnected ? (
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={onDisconnect}
                  disabled={loading}
                >
                  Disconnect
                </Button>
              ) : (
                <Button onClick={onConnect} disabled={loading}>
                  Connect
                </Button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border mb-6" />

          {/* Long Description */}
          {integration.longDescription && (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {integration.longDescription}
              </p>
              <div className="border-t border-border mb-6" />
            </>
          )}

          {/* Connection Details (if connected) */}
          {isConnected && integration.connectionInfo && (
            <>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-3">Connection Details</h3>
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  {integration.connectionInfo.baseUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Base URL</span>
                      <span className="text-sm font-mono text-foreground">
                        {integration.connectionInfo.baseUrl}
                      </span>
                    </div>
                  )}
                  {integration.connectionInfo.connectedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Connected</span>
                      <span className="text-sm text-foreground">
                        {new Date(integration.connectionInfo.connectedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={cn(
                      'text-sm font-medium flex items-center gap-1.5',
                      integration.connectionInfo.status === 'connected' && 'text-emerald-600',
                      integration.connectionInfo.status === 'error' && 'text-red-600',
                    )}>
                      <span className={cn(
                        'w-2 h-2 rounded-full',
                        integration.connectionInfo.status === 'connected' && 'bg-emerald-500',
                        integration.connectionInfo.status === 'error' && 'bg-red-500',
                        integration.connectionInfo.status === 'disconnected' && 'bg-gray-400',
                      )} />
                      {integration.connectionInfo.status === 'connected' && 'Connected'}
                      {integration.connectionInfo.status === 'error' && 'Error'}
                      {integration.connectionInfo.status === 'disconnected' && 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-t border-border mb-6" />
            </>
          )}

          {/* Available Actions */}
          {integration.actions && integration.actions.length > 0 && (
            <>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Available Actions
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    {integration.actions.length}
                  </span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {integration.actions.map((action) => (
                    <span
                      key={action}
                      className="px-2.5 py-1 text-xs font-mono bg-muted rounded-md text-muted-foreground"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
              <div className="border-t border-border mb-6" />
            </>
          )}

          {/* Developer */}
          {integration.developer && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Developed by</h3>
              <a
                href="#"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                {integration.developer}
                <ExternalLink className="w-3 h-3" />
              </a>
              <p className="text-xs text-muted-foreground mt-2">
                Only use integrations from developers you trust.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
