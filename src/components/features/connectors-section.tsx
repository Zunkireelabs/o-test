'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Search, Link2, Loader2 } from 'lucide-react';
import { OAUTH_PROVIDERS, type OAuthProvider } from '@/lib/integrations/providers';

const categories = ['All', 'Productivity', 'Communication', 'Project Management', 'Developer Tools', 'CRM & Sales'];

export function ConnectorsSection() {
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  // Load connected integrations from Supabase
  useEffect(() => {
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

  const handleConnect = (provider: OAuthProvider) => {
    // TODO: Implement OAuth flow in Phase 4
    alert(`OAuth flow for ${provider.displayName} coming soon!`);
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect your favorite apps to automatically sync data.
        </p>
      </div>

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
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Connected Apps */}
          {connectedProviders.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Connected</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connectedProviders.map((provider) => (
                  <ProviderCard
                    key={provider.providerId}
                    provider={provider}
                    connected={true}
                    onConnect={() => handleConnect(provider)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Apps */}
          {availableProviders.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Available</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableProviders.map((provider) => (
                  <ProviderCard
                    key={provider.providerId}
                    provider={provider}
                    connected={false}
                    onConnect={() => handleConnect(provider)}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredProviders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No apps found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProviderCard({
  provider,
  connected,
  onConnect,
}: {
  provider: OAuthProvider;
  connected: boolean;
  onConnect: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {provider.icon.startsWith('http') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={provider.icon} alt={provider.displayName} className="w-8 h-8" />
            ) : (
              <span className="text-2xl">{provider.icon}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{provider.displayName}</h3>
              {connected && (
                <Badge className="bg-green-100 text-green-700 text-xs">Connected</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{provider.description}</p>
            <div className="flex items-center gap-2 mt-3">
              {!connected && (
                <Button size="sm" onClick={onConnect}>
                  <Link2 className="w-3 h-3 mr-1" />
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
