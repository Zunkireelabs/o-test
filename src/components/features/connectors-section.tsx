'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Search, Link2, Loader2, Unlink, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { OAUTH_PROVIDERS, type OAuthProvider } from '@/lib/integrations/providers';
import { getCredentialKey } from '@/lib/integrations/credential-keys';
import { ProviderSetupModal } from '@/components/features/provider-setup-modal';

const categories = ['All', 'Productivity', 'Communication', 'Project Management', 'Developer Tools', 'CRM & Sales'];

export function ConnectorsSection() {
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [setupProvider, setSetupProvider] = useState<OAuthProvider | null>(null);

  const searchParams = useSearchParams();

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  // Handle OAuth callback notifications
  useEffect(() => {
    const oauthSuccess = searchParams.get('oauth_success');
    const oauthError = searchParams.get('oauth_error');

    if (oauthSuccess) {
      setNotification({ type: 'success', message: `Successfully connected to ${oauthSuccess}!` });
      // Reload connections
      loadConnections();
    } else if (oauthError) {
      setNotification({ type: 'error', message: `Failed to connect: ${oauthError}` });
    }

    // Clear notification after 5 seconds
    if (oauthSuccess || oauthError) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const loadConnections = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: integrations } = await supabase
        .from('integrations')
        .select('provider')
        .eq('user_id', user.id)
        .eq('status', 'connected');

      const providers = (integrations as { provider: string }[] | null)?.map(i => i.provider) || [];
      setConnectedIds(providers);
    } catch (err) {
      console.error('Failed to load integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load connected integrations from Supabase
  useEffect(() => {
    loadConnections();
  }, [supabase]);

  const filteredProviders = OAUTH_PROVIDERS.filter((provider) => {
    const matchesSearch = provider.displayName.toLowerCase().includes(search.toLowerCase()) ||
                          provider.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || provider.category === category;
    return matchesSearch && matchesCategory;
  });

  const connectedProviders = filteredProviders.filter((p) => connectedIds.includes(p.providerId));
  const availableProviders = filteredProviders.filter((p) => !connectedIds.includes(p.providerId));

  const initiateOAuth = async (provider: OAuthProvider) => {
    setConnectingId(provider.providerId);
    try {
      const response = await fetch(`/api/integrations/oauth/${provider.providerId}/authorize`);
      const data = await response.json();

      if (data.error) {
        setNotification({ type: 'error', message: data.error });
        return;
      }

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (err) {
      console.error('Failed to initiate OAuth:', err);
      setNotification({ type: 'error', message: 'Failed to start authentication' });
    } finally {
      setConnectingId(null);
    }
  };

  const handleConnect = async (provider: OAuthProvider) => {
    // Check if credentials already exist for this provider family
    const credentialKey = getCredentialKey(provider.providerId);
    setConnectingId(provider.providerId);
    try {
      const res = await fetch(`/api/integrations/credentials/${credentialKey}`);
      const { exists } = await res.json();

      if (exists) {
        // Credentials found — go straight to OAuth
        await initiateOAuth(provider);
      } else {
        // No credentials — show setup modal
        setConnectingId(null);
        setSetupProvider(provider);
      }
    } catch {
      // Fallback: try OAuth directly (env vars might be set)
      await initiateOAuth(provider);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    setConnectingId(providerId);
    try {
      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) return;

      // Work around Supabase type inference issue
      const integrationsTable = client.from('integrations');
      const { error } = await (integrationsTable as unknown as {
        update: (data: { status: string }) => {
          eq: (col: string, val: string) => {
            eq: (col: string, val: string) => Promise<{ error: Error | null }>;
          };
        };
      }).update({ status: 'disconnected' })
        .eq('user_id', user.id)
        .eq('provider', providerId);

      if (error) throw error;

      setConnectedIds(prev => prev.filter(id => id !== providerId));
      setNotification({ type: 'success', message: 'Disconnected successfully' });
    } catch (err) {
      console.error('Failed to disconnect:', err);
      setNotification({ type: 'error', message: 'Failed to disconnect' });
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-[-0.025em]">Integrations</h1>
        <p className="text-sm text-zinc-500 mt-1.5 tracking-[-0.01em]">
          Connect your favorite apps to automatically sync data.
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium tracking-[-0.01em] ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search apps..."
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Connected Apps */}
          {connectedProviders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 mb-4 tracking-[-0.02em]">Connected</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connectedProviders.map((provider) => (
                  <ProviderCard
                    key={provider.providerId}
                    provider={provider}
                    connected={true}
                    loading={connectingId === provider.providerId}
                    onConnect={() => handleConnect(provider)}
                    onDisconnect={() => handleDisconnect(provider.providerId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Apps */}
          {availableProviders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 mb-4 tracking-[-0.02em]">Available</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableProviders.map((provider) => (
                  <ProviderCard
                    key={provider.providerId}
                    provider={provider}
                    connected={false}
                    loading={connectingId === provider.providerId}
                    onConnect={() => handleConnect(provider)}
                    onDisconnect={() => {}}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredProviders.length === 0 && (
            <div className="text-center py-12 text-zinc-500 text-sm tracking-[-0.01em]">
              No apps found matching your criteria.
            </div>
          )}
        </div>
      )}

      <ProviderSetupModal
        provider={setupProvider}
        open={!!setupProvider}
        onOpenChange={(open) => { if (!open) setSetupProvider(null); }}
        onCredentialsSaved={() => {
          const provider = setupProvider;
          setSetupProvider(null);
          if (provider) initiateOAuth(provider);
        }}
      />
    </div>
  );
}

function ProviderCard({
  provider,
  connected,
  loading,
  onConnect,
  onDisconnect,
}: {
  provider: OAuthProvider;
  connected: boolean;
  loading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {provider.icon.startsWith('http') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={provider.icon} alt={provider.displayName} className="w-8 h-8" />
            ) : (
              <span className="text-2xl">{provider.icon}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-zinc-900 tracking-[-0.01em]">{provider.displayName}</h3>
              {connected && (
                <Badge className="bg-emerald-100 text-emerald-700 text-xs font-medium">Connected</Badge>
              )}
            </div>
            <p className="text-sm text-zinc-500 mt-0.5 line-clamp-2 tracking-[-0.01em]">{provider.description}</p>
            <div className="flex items-center gap-2 mt-3">
              {connected ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                  onClick={onDisconnect}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Unlink className="w-3 h-3 mr-1" />
                  )}
                  Disconnect
                </Button>
              ) : (
                <Button size="sm" onClick={onConnect} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Link2 className="w-3 h-3 mr-1" />
                  )}
                  Connect
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
