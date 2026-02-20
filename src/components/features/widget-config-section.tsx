'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WidgetConfigSection() {
  const [config, setConfig] = useState({
    brand_name: '',
    tone: 'neutral',
    primary_color: '#2563eb',
    welcome_message: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await api.getConfig();
        setConfig({
          brand_name: data.brand_name || '',
          tone: data.tone || 'neutral',
          primary_color: data.primary_color || '#2563eb',
          welcome_message: data.welcome_message || '',
        });
      } catch (err) {
        console.error('Failed to load config:', err);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus('idle');

    try {
      await api.updateConfig(config);
      setStatus('success');
      setMessage('Configuration saved successfully');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-[-0.025em]">Widget Configuration</h1>
        <p className="text-sm text-zinc-500 mt-1.5 tracking-[-0.01em]">
          Customize how your chat widget looks and behaves.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="brandName" className="tracking-[-0.01em]">Brand Name</Label>
            <Input
              id="brandName"
              value={config.brand_name}
              onChange={(e) => setConfig({ ...config, brand_name: e.target.value })}
              placeholder="Your Brand"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone" className="tracking-[-0.01em]">Tone</Label>
            <Select
              value={config.tone}
              onValueChange={(value) => setConfig({ ...config, tone: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryColor" className="tracking-[-0.01em]">Primary Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="primaryColor"
                value={config.primary_color}
                onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-200"
              />
              <Input
                value={config.primary_color}
                onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                placeholder="#2563eb"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeMessage" className="tracking-[-0.01em]">Welcome Message</Label>
            <Textarea
              id="welcomeMessage"
              value={config.welcome_message}
              onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
              placeholder="Hi! How can I help you today?"
              rows={3}
            />
          </div>

          {status !== 'idle' && (
            <div
              className={cn(
                'flex items-center gap-2 p-3 rounded-xl text-sm font-medium tracking-[-0.01em]',
                status === 'success' && 'bg-emerald-50 text-emerald-700',
                status === 'error' && 'bg-red-50 text-red-700'
              )}
            >
              {status === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message}
            </div>
          )}

          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
