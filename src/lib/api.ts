const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('orca_token');
  }

  async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && path !== '/api/v1/client/login') {
      sessionStorage.removeItem('orca_token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      await fetch(`${API_URL}/health`);
      return true;
    } catch {
      return false;
    }
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: { name: string; email: string; site_id: string } }>(
      '/api/v1/client/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
  }

  async getMe() {
    return this.request<{ name: string; email: string; site_id: string; created_at: string }>(
      '/api/v1/client/me'
    );
  }

  // Ingestion
  async ingestUrl(url: string, maxPages: number) {
    return this.request('/api/v1/client/ingest/url', {
      method: 'POST',
      body: JSON.stringify({ url, max_pages: maxPages }),
    });
  }

  async ingestText(title: string, content: string) {
    return this.request('/api/v1/client/ingest/text', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
  }

  async ingestFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/v1/client/ingest/file`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    return response.json();
  }

  // Jobs
  async getJobs() {
    return this.request<{ jobs: Array<{
      id: string;
      source_type: string;
      source: string;
      status: string;
      chunk_count: number;
      created_at: string;
    }> }>('/api/v1/client/jobs');
  }

  // Widget Config
  async getConfig() {
    return this.request<{
      brand_name: string;
      tone: string;
      primary_color: string;
      welcome_message: string;
    }>('/api/v1/client/config');
  }

  async updateConfig(config: {
    brand_name: string;
    tone: string;
    primary_color: string;
    welcome_message: string;
  }) {
    return this.request('/api/v1/client/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Knowledge Base
  async getKnowledge() {
    return this.request<{ items: Array<{
      id: string;
      title: string;
      source_type: string;
      chunk_count: number;
      created_at: string;
    }> }>('/api/v1/client/knowledge');
  }

  // Embed Code
  async getEmbedCode() {
    return this.request<{ code: string }>('/api/v1/client/embed-code');
  }

  // API Keys
  async getApiKeys() {
    return this.request<{
      client_key_preview: string;
      openai_key_set: boolean;
    }>('/api/v1/client/api-keys');
  }

  async regenerateApiKey() {
    return this.request<{ key: string }>('/api/v1/client/api-keys/regenerate', {
      method: 'POST',
    });
  }

  async setOpenAIKey(key: string) {
    return this.request('/api/v1/client/api-keys/openai', {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
  }

  async removeOpenAIKey() {
    return this.request('/api/v1/client/api-keys/openai', {
      method: 'DELETE',
    });
  }

  // Connectors
  async getConnectorApps() {
    return this.request<{ apps: Array<{
      id: string;
      name: string;
      icon: string;
      category: string;
      description: string;
      connected: boolean;
      connector_id?: string;
    }> }>('/api/v1/client/connectors/apps');
  }

  async authorizeConnector(providerId: string) {
    return this.request<{ authorization_url: string }>(
      `/api/v1/client/connectors/oauth/${providerId}/authorize`
    );
  }

  async disconnectConnector(connectorId: string) {
    return this.request(`/api/v1/client/connectors/${connectorId}/disconnect`, {
      method: 'POST',
    });
  }

  async syncConnector(connectorId: string) {
    return this.request(`/api/v1/client/connectors/${connectorId}/sync`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
