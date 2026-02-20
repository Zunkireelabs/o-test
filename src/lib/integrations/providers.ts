/**
 * OAuth Provider Registry
 * Defines all available app integrations for Orca
 */

export interface OAuthProvider {
  providerId: string;
  displayName: string;
  icon: string;
  category: string;
  description: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  supportsSync: boolean;
}

export const OAUTH_PROVIDERS: OAuthProvider[] = [
  // ── Productivity ──────────────────────────────────────────────────────
  {
    providerId: 'notion',
    displayName: 'Notion',
    icon: 'https://cdn.simpleicons.org/notion/000000',
    category: 'Productivity',
    description: 'Connect your Notion workspace to sync pages and databases.',
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scopes: [],
    supportsSync: true,
  },
  {
    providerId: 'google_drive',
    displayName: 'Google Drive',
    icon: 'https://cdn.simpleicons.org/googledrive',
    category: 'Productivity',
    description: 'Access and sync files from Google Drive.',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/drive.readonly', 'openid', 'email', 'profile'],
    supportsSync: false,
  },
  {
    providerId: 'google_docs',
    displayName: 'Google Docs',
    icon: 'https://cdn.simpleicons.org/googledocs',
    category: 'Productivity',
    description: 'Import content from Google Docs.',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/documents.readonly', 'openid', 'email', 'profile'],
    supportsSync: false,
  },
  {
    providerId: 'onedrive',
    displayName: 'OneDrive',
    icon: 'https://cdn.simpleicons.org/microsoftonedrive',
    category: 'Productivity',
    description: 'Sync files from Microsoft OneDrive.',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['Files.Read.All', 'User.Read', 'offline_access'],
    supportsSync: false,
  },
  {
    providerId: 'dropbox',
    displayName: 'Dropbox',
    icon: 'https://cdn.simpleicons.org/dropbox',
    category: 'Productivity',
    description: 'Access files stored in Dropbox.',
    authUrl: 'https://www.dropbox.com/oauth2/authorize',
    tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
    scopes: [],
    supportsSync: false,
  },
  {
    providerId: 'airtable',
    displayName: 'Airtable',
    icon: 'https://cdn.simpleicons.org/airtable',
    category: 'Productivity',
    description: 'Connect Airtable bases and tables.',
    authUrl: 'https://airtable.com/oauth2/v1/authorize',
    tokenUrl: 'https://airtable.com/oauth2/v1/token',
    scopes: ['data.records:read', 'schema.bases:read'],
    supportsSync: false,
  },

  // ── Communication ─────────────────────────────────────────────────────
  {
    providerId: 'slack',
    displayName: 'Slack',
    icon: 'https://cdn.simpleicons.org/slack',
    category: 'Communication',
    description: 'Connect Slack to index channel messages and threads.',
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['channels:read', 'channels:history', 'users:read'],
    supportsSync: false,
  },
  {
    providerId: 'microsoft_teams',
    displayName: 'Microsoft Teams',
    icon: 'https://cdn.simpleicons.org/microsoftteams',
    category: 'Communication',
    description: 'Sync conversations from Microsoft Teams.',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['Chat.Read', 'User.Read', 'offline_access'],
    supportsSync: false,
  },
  {
    providerId: 'gmail',
    displayName: 'Gmail',
    icon: 'https://cdn.simpleicons.org/gmail',
    category: 'Communication',
    description: 'Index emails from Gmail.',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'openid', 'email', 'profile'],
    supportsSync: false,
  },
  {
    providerId: 'discord',
    displayName: 'Discord',
    icon: 'https://cdn.simpleicons.org/discord',
    category: 'Communication',
    description: 'Connect Discord servers and channels.',
    authUrl: 'https://discord.com/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    scopes: ['identify', 'guilds'],
    supportsSync: false,
  },
  {
    providerId: 'zoom',
    displayName: 'Zoom',
    icon: 'https://cdn.simpleicons.org/zoom',
    category: 'Communication',
    description: 'Sync Zoom meeting transcripts.',
    authUrl: 'https://zoom.us/oauth/authorize',
    tokenUrl: 'https://zoom.us/oauth/token',
    scopes: [],
    supportsSync: false,
  },

  // ── Project Management ────────────────────────────────────────────────
  {
    providerId: 'jira',
    displayName: 'Jira',
    icon: 'https://cdn.simpleicons.org/jira',
    category: 'Project Management',
    description: 'Connect Jira to sync issues and projects.',
    authUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    scopes: ['read:jira-work', 'read:jira-user', 'offline_access'],
    supportsSync: false,
  },
  {
    providerId: 'confluence',
    displayName: 'Confluence',
    icon: 'https://cdn.simpleicons.org/confluence',
    category: 'Project Management',
    description: 'Sync Confluence pages and spaces.',
    authUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    scopes: ['read:confluence-content.all', 'read:confluence-user', 'offline_access'],
    supportsSync: false,
  },
  {
    providerId: 'asana',
    displayName: 'Asana',
    icon: 'https://cdn.simpleicons.org/asana',
    category: 'Project Management',
    description: 'Import tasks and projects from Asana.',
    authUrl: 'https://app.asana.com/-/oauth_authorize',
    tokenUrl: 'https://app.asana.com/-/oauth_token',
    scopes: [],
    supportsSync: false,
  },
  {
    providerId: 'trello',
    displayName: 'Trello',
    icon: 'https://cdn.simpleicons.org/trello',
    category: 'Project Management',
    description: 'Sync Trello boards and cards.',
    authUrl: 'https://trello.com/1/authorize',
    tokenUrl: 'https://trello.com/1/OAuthGetAccessToken',
    scopes: ['read'],
    supportsSync: false,
  },
  {
    providerId: 'linear',
    displayName: 'Linear',
    icon: 'https://cdn.simpleicons.org/linear',
    category: 'Project Management',
    description: 'Connect Linear to sync issues and projects.',
    authUrl: 'https://linear.app/oauth/authorize',
    tokenUrl: 'https://api.linear.app/oauth/token',
    scopes: ['read'],
    supportsSync: false,
  },
  {
    providerId: 'clickup',
    displayName: 'ClickUp',
    icon: 'https://cdn.simpleicons.org/clickup',
    category: 'Project Management',
    description: 'Import tasks and docs from ClickUp.',
    authUrl: 'https://app.clickup.com/api',
    tokenUrl: 'https://api.clickup.com/api/v2/oauth/token',
    scopes: [],
    supportsSync: false,
  },

  // ── Developer Tools ───────────────────────────────────────────────────
  {
    providerId: 'github',
    displayName: 'GitHub',
    icon: 'https://cdn.simpleicons.org/github/000000',
    category: 'Developer Tools',
    description: 'Index repositories and documentation from GitHub.',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['read:user', 'repo'],
    supportsSync: false,
  },
  {
    providerId: 'gitlab',
    displayName: 'GitLab',
    icon: 'https://cdn.simpleicons.org/gitlab',
    category: 'Developer Tools',
    description: 'Sync repositories from GitLab.',
    authUrl: 'https://gitlab.com/oauth/authorize',
    tokenUrl: 'https://gitlab.com/oauth/token',
    scopes: ['read_user', 'read_api'],
    supportsSync: false,
  },
  {
    providerId: 'bitbucket',
    displayName: 'Bitbucket',
    icon: 'https://cdn.simpleicons.org/bitbucket',
    category: 'Developer Tools',
    description: 'Connect Bitbucket repositories.',
    authUrl: 'https://bitbucket.org/site/oauth2/authorize',
    tokenUrl: 'https://bitbucket.org/site/oauth2/access_token',
    scopes: ['repository', 'account'],
    supportsSync: false,
  },
  {
    providerId: 'figma',
    displayName: 'Figma',
    icon: 'https://cdn.simpleicons.org/figma',
    category: 'Developer Tools',
    description: 'Access Figma files and design data.',
    authUrl: 'https://www.figma.com/oauth',
    tokenUrl: 'https://www.figma.com/api/oauth/token',
    scopes: ['file_read'],
    supportsSync: false,
  },

  // ── CRM & Sales ───────────────────────────────────────────────────────
  {
    providerId: 'salesforce',
    displayName: 'Salesforce',
    icon: 'https://cdn.simpleicons.org/salesforce',
    category: 'CRM & Sales',
    description: 'Sync contacts, leads, and knowledge from Salesforce.',
    authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    scopes: ['api', 'refresh_token'],
    supportsSync: false,
  },
  {
    providerId: 'hubspot',
    displayName: 'HubSpot',
    icon: 'https://cdn.simpleicons.org/hubspot',
    category: 'CRM & Sales',
    description: 'Connect HubSpot CRM data.',
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    scopes: ['crm.objects.contacts.read'],
    supportsSync: false,
  },
  {
    providerId: 'pipedrive',
    displayName: 'Pipedrive',
    icon: 'https://cdn.simpleicons.org/pipedrive',
    category: 'CRM & Sales',
    description: 'Sync deals and contacts from Pipedrive.',
    authUrl: 'https://oauth.pipedrive.com/oauth/authorize',
    tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
    scopes: [],
    supportsSync: false,
  },

  // ── Support ───────────────────────────────────────────────────────────
  {
    providerId: 'zendesk',
    displayName: 'Zendesk',
    icon: 'https://cdn.simpleicons.org/zendesk',
    category: 'Support',
    description: 'Sync Zendesk tickets and help center articles.',
    authUrl: 'https://yoursubdomain.zendesk.com/oauth/authorizations/new',
    tokenUrl: 'https://yoursubdomain.zendesk.com/oauth/tokens',
    scopes: ['read'],
    supportsSync: false,
  },
  {
    providerId: 'intercom',
    displayName: 'Intercom',
    icon: 'https://cdn.simpleicons.org/intercom',
    category: 'Support',
    description: 'Connect Intercom conversations and articles.',
    authUrl: 'https://app.intercom.com/oauth',
    tokenUrl: 'https://api.intercom.io/auth/eagle/token',
    scopes: [],
    supportsSync: false,
  },

  // ── Social Media ──────────────────────────────────────────────────────
  {
    providerId: 'linkedin',
    displayName: 'LinkedIn',
    icon: 'https://cdn.simpleicons.org/linkedin',
    category: 'Social Media',
    description: 'Connect your LinkedIn profile.',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['openid', 'profile', 'email'],
    supportsSync: false,
  },
  {
    providerId: 'twitter',
    displayName: 'Twitter / X',
    icon: 'https://cdn.simpleicons.org/x/000000',
    category: 'Social Media',
    description: 'Connect your X (Twitter) account.',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scopes: ['tweet.read', 'users.read', 'offline.access'],
    supportsSync: false,
  },
];

// Helper functions
export function getProvider(providerId: string): OAuthProvider | undefined {
  return OAUTH_PROVIDERS.find(p => p.providerId === providerId);
}

export function getProvidersByCategory(category: string): OAuthProvider[] {
  if (category === 'All') return OAUTH_PROVIDERS;
  return OAUTH_PROVIDERS.filter(p => p.category === category);
}

export function getAllCategories(): string[] {
  const categories = new Set(OAUTH_PROVIDERS.map(p => p.category));
  return ['All', ...Array.from(categories)];
}
