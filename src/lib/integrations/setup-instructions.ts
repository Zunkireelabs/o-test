export interface SetupStep {
  title: string;
  description: string;
  link?: { url: string; label: string };
}

export interface ProviderSetupInfo {
  displayName: string;
  steps: SetupStep[];
  callbackUrlNote: string;
}

export const SETUP_INSTRUCTIONS: Record<string, ProviderSetupInfo> = {
  google: {
    displayName: 'Google OAuth App',
    steps: [
      {
        title: 'Open Google Cloud Console',
        description: 'Go to the Google Cloud Console and select or create a project.',
        link: { url: 'https://console.cloud.google.com/apis/credentials', label: 'Open Google Cloud Console' },
      },
      {
        title: 'Configure OAuth consent screen',
        description: 'Navigate to "OAuth consent screen", choose External user type, fill in the app name and required fields.',
      },
      {
        title: 'Create OAuth credentials',
        description: 'Go to "Credentials" > "Create Credentials" > "OAuth client ID". Select "Web application" as the type.',
      },
      {
        title: 'Set the redirect URI',
        description: 'Under "Authorized redirect URIs", add the callback URL shown below.',
      },
      {
        title: 'Copy your credentials',
        description: 'Copy the Client ID and Client Secret from the confirmation dialog and paste them below.',
      },
    ],
    callbackUrlNote: 'Add this as an Authorized redirect URI in your Google Cloud Console:',
  },

  github: {
    displayName: 'GitHub OAuth App',
    steps: [
      {
        title: 'Open GitHub Developer Settings',
        description: 'Go to Settings > Developer settings > OAuth Apps > New OAuth App.',
        link: { url: 'https://github.com/settings/applications/new', label: 'Create GitHub OAuth App' },
      },
      {
        title: 'Fill in application details',
        description: 'Enter your app name and homepage URL. The homepage can be your app\'s public URL.',
      },
      {
        title: 'Set the callback URL',
        description: 'Set the "Authorization callback URL" to the callback URL shown below.',
      },
      {
        title: 'Copy your credentials',
        description: 'After creating the app, copy the Client ID. Then generate a new Client Secret and copy it.',
      },
    ],
    callbackUrlNote: 'Set this as the Authorization callback URL:',
  },

  slack: {
    displayName: 'Slack App',
    steps: [
      {
        title: 'Create a Slack App',
        description: 'Go to the Slack API dashboard and click "Create New App" > "From scratch".',
        link: { url: 'https://api.slack.com/apps', label: 'Open Slack API Dashboard' },
      },
      {
        title: 'Configure OAuth & Permissions',
        description: 'In the sidebar, go to "OAuth & Permissions". Add the required bot token scopes: channels:read, channels:history, users:read.',
      },
      {
        title: 'Set the redirect URL',
        description: 'Under "Redirect URLs", add the callback URL shown below.',
      },
      {
        title: 'Copy your credentials',
        description: 'Go to "Basic Information" to find your Client ID and Client Secret.',
      },
    ],
    callbackUrlNote: 'Add this as a Redirect URL in OAuth & Permissions:',
  },

  notion: {
    displayName: 'Notion Integration',
    steps: [
      {
        title: 'Create a Notion integration',
        description: 'Go to the Notion Integrations page and click "New integration".',
        link: { url: 'https://www.notion.so/my-integrations', label: 'Open Notion Integrations' },
      },
      {
        title: 'Configure the integration',
        description: 'Give it a name, select your workspace, and set the type to "Public" (required for OAuth).',
      },
      {
        title: 'Set the redirect URI',
        description: 'Under "OAuth Domain & URIs", add the callback URL shown below as the redirect URI.',
      },
      {
        title: 'Copy your credentials',
        description: 'Copy the "OAuth client ID" and "OAuth client secret" from the integration\'s Secrets section.',
      },
    ],
    callbackUrlNote: 'Add this as the Redirect URI:',
  },

  atlassian: {
    displayName: 'Atlassian OAuth App',
    steps: [
      {
        title: 'Open Atlassian Developer Console',
        description: 'Go to the Atlassian Developer Console and create a new OAuth 2.0 app.',
        link: { url: 'https://developer.atlassian.com/console/myapps/', label: 'Open Atlassian Console' },
      },
      {
        title: 'Configure permissions',
        description: 'Under "Permissions", add the Jira and/or Confluence scopes your integration needs.',
      },
      {
        title: 'Set the callback URL',
        description: 'Under "Authorization" > "OAuth 2.0 (3LO)", add the callback URL shown below.',
      },
      {
        title: 'Copy your credentials',
        description: 'Go to "Settings" to find your Client ID and Secret.',
      },
    ],
    callbackUrlNote: 'Add this as the Callback URL:',
  },

  microsoft: {
    displayName: 'Microsoft Azure App',
    steps: [
      {
        title: 'Open Azure Portal',
        description: 'Go to Azure Active Directory > App registrations > New registration.',
        link: { url: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade', label: 'Open Azure Portal' },
      },
      {
        title: 'Register the application',
        description: 'Enter a name, select "Accounts in any organizational directory and personal Microsoft accounts" for supported account types.',
      },
      {
        title: 'Set the redirect URI',
        description: 'Under "Redirect URIs", select "Web" and add the callback URL shown below.',
      },
      {
        title: 'Create a client secret',
        description: 'Go to "Certificates & secrets" > "New client secret". Copy the Value (not the Secret ID).',
      },
      {
        title: 'Copy your credentials',
        description: 'The Client ID is on the Overview page ("Application (client) ID"). Paste both values below.',
      },
    ],
    callbackUrlNote: 'Add this as a Redirect URI (Web platform):',
  },
};

const GENERIC_SETUP: ProviderSetupInfo = {
  displayName: 'OAuth App',
  steps: [
    {
      title: 'Create an OAuth application',
      description: 'Go to the provider\'s developer portal and create a new OAuth application.',
    },
    {
      title: 'Set the redirect URI',
      description: 'Configure the callback/redirect URL to the one shown below.',
    },
    {
      title: 'Copy your credentials',
      description: 'Copy the Client ID and Client Secret and paste them below.',
    },
  ],
  callbackUrlNote: 'Set this as the redirect/callback URL:',
};

export function getSetupInstructions(credentialKey: string): ProviderSetupInfo {
  return SETUP_INSTRUCTIONS[credentialKey] || GENERIC_SETUP;
}
