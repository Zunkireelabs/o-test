/**
 * Maps provider IDs to shared credential families.
 * Providers that share the same OAuth app (e.g., Google Drive + Docs + Gmail)
 * return the same credential key so credentials are stored/looked up once.
 */

const CREDENTIAL_KEY_MAP: Record<string, string> = {
  // Google family
  google_drive: 'google',
  google_docs: 'google',
  google_calendar: 'google',
  google_sheets: 'google',
  gmail: 'google',
  google_meet: 'google',

  // Atlassian family
  jira: 'atlassian',
  confluence: 'atlassian',

  // Microsoft family
  onedrive: 'microsoft',
  microsoft_teams: 'microsoft',
};

export function getCredentialKey(providerId: string): string {
  return CREDENTIAL_KEY_MAP[providerId] || providerId;
}
