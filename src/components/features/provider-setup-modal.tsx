'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ExternalLink, Copy, Check } from 'lucide-react';
import { getCredentialKey } from '@/lib/integrations/credential-keys';
import { getSetupInstructions } from '@/lib/integrations/setup-instructions';
import type { OAuthProvider } from '@/lib/integrations/providers';

interface ProviderSetupModalProps {
  provider: OAuthProvider | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCredentialsSaved: () => void;
}

export function ProviderSetupModal({
  provider,
  open,
  onOpenChange,
  onCredentialsSaved,
}: ProviderSetupModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!provider) return null;

  const credentialKey = getCredentialKey(provider.providerId);
  const instructions = getSetupInstructions(credentialKey);
  const totalSteps = instructions.steps.length;
  const isLastStep = currentStep === totalSteps - 1;

  const callbackUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/integrations/oauth/callback`
    : '';

  const handleCopyCallback = async () => {
    await navigator.clipboard.writeText(callbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError('Both Client ID and Client Secret are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/integrations/credentials/${credentialKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId.trim(), client_secret: clientSecret.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save credentials');
      }

      // Reset state and notify parent
      setCurrentStep(0);
      setClientId('');
      setClientSecret('');
      onCredentialsSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCurrentStep(0);
      setClientId('');
      setClientSecret('');
      setError(null);
    }
    onOpenChange(open);
  };

  const step = instructions.steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="tracking-[-0.025em]">
            Set up {instructions.displayName}
          </DialogTitle>
          <DialogDescription className="tracking-[-0.01em]">
            Follow these steps to create your OAuth credentials for {provider.displayName}.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-2">
          {instructions.steps.map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  i < currentStep
                    ? 'bg-emerald-100 text-emerald-700'
                    : i === currentStep
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-400'
                }`}
              >
                {i < currentStep ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              {i < totalSteps - 1 && (
                <div
                  className={`h-px w-6 ${
                    i < currentStep ? 'bg-emerald-300' : 'bg-zinc-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-zinc-900 text-sm tracking-[-0.01em]">
              {step.title}
            </h3>
            <p className="text-sm text-zinc-500 mt-1 tracking-[-0.01em]">
              {step.description}
            </p>
            {step.link && (
              <a
                href={step.link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2 font-medium"
              >
                {step.link.label}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Callback URL (shown on the redirect URI step and last step) */}
          {(step.title.toLowerCase().includes('redirect') ||
            step.title.toLowerCase().includes('callback')) && callbackUrl && (
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500">{instructions.callbackUrlNote}</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-zinc-100 px-3 py-2 rounded-md text-zinc-700 break-all">
                  {callbackUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyCallback}
                  className="shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          )}

          {/* Credential inputs (shown on last step) */}
          {isLastStep && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="client-id">Client ID</Label>
                <Input
                  id="client-id"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter your Client ID"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-secret">Client Secret</Label>
                <Input
                  id="client-secret"
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter your Client Secret"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          <div className="flex gap-2">
            {isLastStep ? (
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Save &amp; Connect
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
