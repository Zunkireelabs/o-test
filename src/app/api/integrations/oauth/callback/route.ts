import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/integrations/providers';
import { getAndDeleteState } from '@/lib/integrations/state-store';
import { getCredentialKey } from '@/lib/integrations/credential-keys';

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

  // Look up and consume state token (atomic get + delete)
  const stateData = getAndDeleteState(state);
  if (!stateData) {
    return NextResponse.redirect(`${dashboardUrl}?oauth_error=invalid_state`);
  }

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
    const tokenResponse = await exchangeCodeForTokens(providerId, provider, code, callbackUrl, userId);

    if (!tokenResponse.access_token) {
      throw new Error('No access token received');
    }

    // Fetch user info if available
    let accountName = provider.displayName;
    const externalAccountId = '';

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

async function getCredentials(
  providerId: string,
  userId: string
): Promise<{ clientId: string; clientSecret: string }> {
  const credentialKey = getCredentialKey(providerId);

  // Try DB first
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin.from('provider_credentials') as any)
    .select('client_id, client_secret')
    .eq('user_id', userId)
    .eq('credential_key', credentialKey)
    .maybeSingle();

  if (data?.client_id && data?.client_secret) {
    return { clientId: data.client_id, clientSecret: data.client_secret };
  }

  // Fallback to env vars
  if (credentialKey === 'google') {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    };
  }
  if (credentialKey === 'atlassian') {
    return {
      clientId: process.env.ATLASSIAN_CLIENT_ID || '',
      clientSecret: process.env.ATLASSIAN_CLIENT_SECRET || '',
    };
  }
  if (credentialKey === 'microsoft') {
    return {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    };
  }
  return {
    clientId: process.env[`${providerId.toUpperCase()}_CLIENT_ID`] || '',
    clientSecret: process.env[`${providerId.toUpperCase()}_CLIENT_SECRET`] || '',
  };
}

async function exchangeCodeForTokens(
  providerId: string,
  provider: { tokenUrl: string },
  code: string,
  redirectUri: string,
  userId: string
): Promise<TokenResponse> {
  const { clientId, clientSecret } = await getCredentials(providerId, userId);

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
  if (providerId === 'notion') {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  // GitHub requires Accept header
  if (providerId === 'github') {
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
