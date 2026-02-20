import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/integrations/providers';
import { randomBytes } from 'crypto';

// Store state tokens temporarily (in production, use Redis or database)
const stateStore = new Map<string, { providerId: string; userId: string; expiresAt: number }>();

// Clean up expired states periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of stateStore.entries()) {
    if (value.expiresAt < now) {
      stateStore.delete(key);
    }
  }
}, 60000);

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
    stateStore.set(state, {
      providerId,
      userId: user.id,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Build callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const callbackUrl = `${baseUrl}/api/integrations/oauth/callback`;

    // Build authorization URL
    const authUrl = new URL(provider.authUrl);
    authUrl.searchParams.set('client_id', getClientId(providerId));
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

function getClientId(providerId: string): string {
  const envKey = `${providerId.toUpperCase()}_CLIENT_ID`;
  return process.env[envKey] || '';
}

function addProviderSpecificParams(url: URL, providerId: string) {
  switch (providerId) {
    case 'google_drive':
    case 'google_docs':
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

// Export state store for callback route
export { stateStore };
