import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/integrations/providers';

// Import state store from authorize route
// In production, use Redis or database for state storage
const stateStore = new Map<string, { providerId: string; userId: string; expiresAt: number }>();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const dashboardUrl = `${baseUrl}/dashboard`;

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(`${dashboardUrl}?oauth_error=${error}`);
  }

  // Validate state and code
  if (!state || !code) {
    return NextResponse.redirect(`${dashboardUrl}?oauth_error=missing_params`);
  }

  // Look up and consume state token
  const stateData = stateStore.get(state);
  if (!stateData) {
    return NextResponse.redirect(`${dashboardUrl}?oauth_error=invalid_state`);
  }
  stateStore.delete(state);

  // Check if state has expired
  if (stateData.expiresAt < Date.now()) {
    return NextResponse.redirect(`${dashboardUrl}?oauth_error=state_expired`);
  }

  const { providerId, userId } = stateData;
  const provider = getProvider(providerId);

  if (!provider) {
    return NextResponse.redirect(`${dashboardUrl}?oauth_error=unknown_provider`);
  }

  try {
    // Exchange code for tokens
    const callbackUrl = `${baseUrl}/api/integrations/oauth/callback`;
    const tokenResponse = await exchangeCodeForTokens(provider, code, callbackUrl);

    if (!tokenResponse.access_token) {
      throw new Error('No access token received');
    }

    // Fetch user info if available
    let accountName = provider.displayName;
    let externalAccountId = '';

    // Get Supabase client
    const supabase = await createClient();

    // Store the integration in database
    const integrationData = {
      user_id: userId,
      provider: providerId,
      name: accountName,
      credentials: {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || null,
        token_type: tokenResponse.token_type || 'Bearer',
        expires_at: tokenResponse.expires_in
          ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
          : null,
      },
      config: {
        external_account_id: externalAccountId,
        connected_at: new Date().toISOString(),
      },
      status: 'connected',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await supabase.from('integrations').insert(integrationData as any);

    if (insertError) {
      console.error('Failed to save integration:', insertError);
      return NextResponse.redirect(`${dashboardUrl}?oauth_error=save_failed`);
    }

    return NextResponse.redirect(`${dashboardUrl}?oauth_success=${providerId}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(`${dashboardUrl}?oauth_error=token_exchange_failed`);
  }
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
}

async function exchangeCodeForTokens(
  provider: { providerId: string; tokenUrl: string },
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const clientId = process.env[`${provider.providerId.toUpperCase()}_CLIENT_ID`] || '';
  const clientSecret = process.env[`${provider.providerId.toUpperCase()}_CLIENT_SECRET`] || '';

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  // Some providers require different content types or auth methods
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // Notion requires Basic auth header
  if (provider.providerId === 'notion') {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  // GitHub requires Accept header
  if (provider.providerId === 'github') {
    headers['Accept'] = 'application/json';
  }

  const response = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers,
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token exchange failed:', errorText);
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json();
}
