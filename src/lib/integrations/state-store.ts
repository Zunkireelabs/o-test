/**
 * Shared OAuth state store for CSRF protection.
 * Both the authorize and callback routes import from this singleton module
 * so they share the same in-memory Map.
 *
 * In production, replace with Redis or database-backed storage.
 */

interface StateData {
  providerId: string;
  userId: string;
  expiresAt: number;
}

const stateStore = new Map<string, StateData>();

// Clean up expired states every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of stateStore.entries()) {
    if (value.expiresAt < now) {
      stateStore.delete(key);
    }
  }
}, 60_000);

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
