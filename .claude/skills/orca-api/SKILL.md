---
name: orca-api
description: Generate API routes and client methods for Orca. Use when adding new API endpoints or backend integrations.
allowed-tools: Write, Read, Glob
---

# Orca API Generator

Create API routes and update the API client.

## API Client Location
`src/lib/api.ts`

## Adding a New API Method

### 1. Add to ApiClient class

```typescript
// GET request
async getResource() {
  return this.request<{ items: Resource[] }>('/api/v1/client/resource');
}

// POST request
async createResource(data: CreateResourceDto) {
  return this.request<Resource>('/api/v1/client/resource', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// PUT request
async updateResource(id: string, data: UpdateResourceDto) {
  return this.request<Resource>(`/api/v1/client/resource/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// DELETE request
async deleteResource(id: string) {
  return this.request(`/api/v1/client/resource/${id}`, {
    method: 'DELETE',
  });
}
```

### 2. Add TypeScript Types

In `src/types/index.ts`:
```typescript
export interface Resource {
  id: string;
  name: string;
  // ... other fields
}

export interface CreateResourceDto {
  name: string;
}

export interface UpdateResourceDto {
  name?: string;
}
```

## Creating Next.js API Route (if needed)

Create at `src/app/api/[route]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Handle GET
    return NextResponse.json({ data: [] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Handle POST
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

## Error Handling

The API client automatically:
- Adds Authorization header from session
- Handles 401 (redirects to login)
- Throws errors for non-OK responses

## Using in Components

```typescript
import { api } from '@/lib/api';

// In a component
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      const result = await api.getResource();
      setData(result.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```
