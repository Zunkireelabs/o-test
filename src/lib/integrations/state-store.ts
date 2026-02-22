/**
 * Shared OAuth state store for CSRF protection.
 * Uses globalThis to ensure a true singleton across Next.js module instances
 * (Turbopack can create separate module contexts for different API routes).
 *
 * In production, replace with Redis or database-backed storage.
 */

interface StateData {
  providerId: string;
  userId: string;
  expiresAt: number;
}

const globalForState = globalThis as unknown as {
  __oauthStateStore?: Map<string, StateData>;
};

const stateStore = (globalForState.__oauthStateStore ??= new Map<string, StateData>());

// Clean up expired states every 60 seconds
if (typeof globalForState.__oauthStateStore !== 'undefined') {
  // Only set up interval once
  const cleanupKey = '__oauthStateCleanup' as const;
  const g = globalThis as unknown as Record<string, boolean>;
  if (!g[cleanupKey]) {
    g[cleanupKey] = true;
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of stateStore.entries()) {
        if (value.expiresAt < now) {
          stateStore.delete(key);
        }
      }
    }, 60_000);
  }
}

export function setState(token: string, data: StateData): void {
  stateStore.set(token, data);
}

export function getAndDeleteState(token: string): StateData | undefined {
  const data = stateStore.get(token);
  if (data) {
    stateStore.delete(token);
  }
  return data;
}
