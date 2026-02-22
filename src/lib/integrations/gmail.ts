import { createAdminClient } from '@/lib/supabase/server';
import { getCredentialKey } from './credential-keys';

/**
 * Send an email via the Gmail API.
 * Builds an RFC 2822 message, base64url-encodes it, and POSTs to messages/send.
 */
export async function sendGmailEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const rawMessage = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body,
  ].join('\r\n');

  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gmail send failed:', errorText);
    return { success: false, error: `Gmail API error: ${response.status}` };
  }

  const data = await response.json();
  return { success: true, messageId: data.id };
}

/**
 * Refresh a Google OAuth access token using the stored refresh_token.
 * Updates the integrations row with the new token and expiry.
 */
export async function refreshGoogleToken(
  refreshToken: string,
  userId: string,
  integrationId: string
): Promise<string> {
  const { clientId, clientSecret } = await getGoogleClientCredentials(userId);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${errorText}`);
  }

  const data = await response.json();
  const newAccessToken: string = data.access_token;
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  // Update the integration record with new token
  const admin = createAdminClient();
  // We need to read the current credentials, then update
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: integration } = await (admin.from('integrations') as any)
    .select('credentials')
    .eq('id', integrationId)
    .single();

  const updatedCredentials = {
    ...(integration?.credentials || {}),
    access_token: newAccessToken,
    expires_at: expiresAt,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('integrations') as any)
    .update({ credentials: updatedCredentials, updated_at: new Date().toISOString() })
    .eq('id', integrationId);

  return newAccessToken;
}

/**
 * Get a valid Gmail access token for a user.
 * Fetches the Gmail integration from DB, refreshes if expired.
 */
export async function getGmailCredentials(
  userId: string
): Promise<{ accessToken: string; integrationId: string } | null> {
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: integration } = await (admin.from('integrations') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'gmail')
    .eq('status', 'connected')
    .maybeSingle();

  if (!integration) return null;

  const credentials = integration.credentials as {
    access_token: string;
    refresh_token?: string;
    expires_at?: string;
  };

  // Check if token is expired (with 5-minute buffer)
  const isExpired =
    credentials.expires_at &&
    new Date(credentials.expires_at).getTime() < Date.now() + 5 * 60 * 1000;

  if (isExpired && credentials.refresh_token) {
    const newToken = await refreshGoogleToken(
      credentials.refresh_token,
      userId,
      integration.id
    );
    return { accessToken: newToken, integrationId: integration.id };
  }

  return { accessToken: credentials.access_token, integrationId: integration.id };
}

/**
 * Fetch Google OAuth client credentials from DB or env vars.
 */
async function getGoogleClientCredentials(
  userId: string
): Promise<{ clientId: string; clientSecret: string }> {
  const credentialKey = getCredentialKey('gmail'); // → 'google'
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
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  };
}
