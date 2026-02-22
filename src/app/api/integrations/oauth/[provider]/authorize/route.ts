import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/integrations/providers';
import { setState } from '@/lib/integrations/state-store';
import { getCredentialKey } from '@/lib/integrations/credential-keys';
import { randomBytes } from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: providerId } = await params;

    // Get the provider configuration
    const provider = getProvider(providerId);
    if (!provider) {
      return NextResponse.json(
        { error: 'Unknown provider' },
        { status: 404 }
      );
    }

    if (!provider.authUrl) {
      return NextResponse.json(
        { error: 'Provider does not support OAuth' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate state token for CSRF protection
    const state = randomBytes(32).toString('hex');
    setState(state, {
      providerId,
      userId: user.id,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Build callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const callbackUrl = `${baseUrl}/api/integrations/oauth/callback`;

    // Build authorization URL
    const authUrl = new URL(provider.authUrl);
    authUrl.searchParams.set('client_id', await getClientId(providerId, user.id));
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);

    if (provider.scopes.length > 0) {
      authUrl.searchParams.set('scope', provider.scopes.join(' '));
    }

    // Add provider-specific parameters
    addProviderSpecificParams(authUrl, providerId);

    return NextResponse.json({
      authorization_url: authUrl.toString(),
    });
  } catch (error) {
    console.error('OAuth authorize error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}

async function getClientId(providerId: string, userId: string): Promise<string> {
  const credentialKey = getCredentialKey(providerId);

  // Try DB first
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin.from('provider_credentials') as any)
    .select('client_id')
    .eq('user_id', userId)
    .eq('credential_key', credentialKey)
    .maybeSingle();

  if (data?.client_id) return data.client_id;

  // Fallback to env vars
  if (credentialKey === 'google') return process.env.GOOGLE_CLIENT_ID || '';
  if (credentialKey === 'atlassian') return process.env.ATLASSIAN_CLIENT_ID || '';
  if (credentialKey === 'microsoft') return process.env.MICROSOFT_CLIENT_ID || '';
  return process.env[`${providerId.toUpperCase()}_CLIENT_ID`] || '';
}

function addProviderSpecificParams(url: URL, providerId: string) {
  switch (providerId) {
    case 'google_drive':
    case 'google_docs':
    case 'google_calendar':
    case 'google_sheets':
    case 'gmail':
      url.searchParams.set('access_type', 'offline');
      url.searchParams.set('prompt', 'consent');
      break;
    case 'notion':
      url.searchParams.set('owner', 'user');
      break;
    case 'dropbox':
      url.searchParams.set('token_access_type', 'offline');
      break;
    case 'jira':
    case 'confluence':
      url.searchParams.set('audience', 'api.atlassian.com');
      url.searchParams.set('prompt', 'consent');
      break;
  }
}
