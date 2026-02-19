'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { Loader2, Search, RefreshCw, Link2, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectorApp {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  connected: boolean;
  connector_id?: string;
}

const categories = ['All', 'Communication', 'Storage', 'Productivity', 'CRM', 'Development'];

export function ConnectorsSection() {
  const [apps, setApps] = useState<ConnectorApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const loadApps = async () => {
    setLoading(true);
    try {
      const data = await api.getConnectorApps();
      setApps(data.apps || []);
    } catch (err) {
      console.error('Failed to load apps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  const handleConnect = async (app: ConnectorApp) => {
    setConnectingId(app.id);
    try {
      const { authorization_url } = await api.authorizeConnector(app.id);
      window.open(authorization_url, '_blank');
    } catch (err) {
      console.error('Failed to connect:', err);
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (app: ConnectorApp) => {
    if (!app.connector_id) return;
    setConnectingId(app.id);
    try {
      await api.disconnectConnector(app.connector_id);
      loadApps();
    } catch (err) {
      console.error('Failed to disconnect:', err);
    } finally {
      setConnectingId(null);
    }
  };

  const handleSync = async (app: ConnectorApp) => {
    if (!app.connector_id) return;
    setConnectingId(app.id);
    try {
      await api.syncConnector(app.connector_id);
      alert('Sync started');
    } catch (err) {
      console.error('Failed to sync:', err);
    } finally {
      setConnectingId(null);
    }
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || app.category === category;
    return matchesSearch && matchesCategory;
  });

  const connectedApps = filteredApps.filter((app) => app.connected);
  const availableApps = filteredApps.filter((app) => !app.connected);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect your favorite apps to automatically sync data.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search apps..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
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
          {connectedApps.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Connected</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connectedApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    loading={connectingId === app.id}
                    onConnect={() => handleConnect(app)}
                    onDisconnect={() => handleDisconnect(app)}
                    onSync={() => handleSync(app)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Apps */}
          {availableApps.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Available</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    loading={connectingId === app.id}
                    onConnect={() => handleConnect(app)}
                    onDisconnect={() => handleDisconnect(app)}
                    onSync={() => handleSync(app)}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredApps.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No apps found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AppCard({
  app,
  loading,
  onConnect,
  onDisconnect,
  onSync,
}: {
  app: ConnectorApp;
  loading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
            {app.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{app.name}</h3>
              {app.connected && (
                <Badge className="bg-green-100 text-green-700 text-xs">Connected</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{app.description}</p>
            <div className="flex items-center gap-2 mt-3">
              {app.connected ? (
                <>
                  <Button size="sm" variant="outline" onClick={onSync} disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-1" />
                    )}
                    Sync
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={onDisconnect}
                    disabled={loading}
                  >
                    <Unlink className="w-3 h-3 mr-1" />
                    Disconnect
                  </Button>
                </>
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
