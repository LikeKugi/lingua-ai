// Centralised access to the browser's localStorage so the rest of the app
// never calls window.localStorage directly. Helpers here own the key names,
// JSON (de)serialisation, and the browser-only guard.

export const STORAGE_KEYS = {
  settings: 'settings:v1',
  prompts: 'prompts:v1',
  history: 'history:v1',
  draft: 'draft:v1',
  apiKey: 'apiKey',
} as const;

// localStorage is unavailable during SSR and may throw when accessed in
// private-mode or blocked contexts. Return null there so callers stay safe.
const safeStorage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

export function readRaw(key: string): string | null {
  return safeStorage()?.getItem(key) ?? null;
}

export function readJson<T>(key: string): T | null {
  const raw = readRaw(key);
  if (raw === null) return null;
  return JSON.parse(raw) as T;
}

export function writeRaw(key: string, value: string): void {
  // Let setItem errors (e.g. quota exceeded) propagate to the caller's
  // try/catch so it can surface a user-facing message.
  safeStorage()?.setItem(key, value);
}

export function writeJson<T>(key: string, value: T): void {
  writeRaw(key, JSON.stringify(value));
}

export function removeKey(key: string): void {
  safeStorage()?.removeItem(key);
}
