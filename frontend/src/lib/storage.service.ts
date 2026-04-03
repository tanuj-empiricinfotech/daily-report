/**
 * Storage Service
 *
 * Type-safe wrapper around localStorage with error handling.
 * All localStorage access should go through this service.
 */

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  THEME_MODE: 'mode',
  THEME_NAME: 'themeName',
  CHAT_DRAFTS: 'team-chat-drafts',
  COLUMN_VISIBILITY: 'logs-table-columns',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

function getItem(key: StorageKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setItem(key: StorageKey, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch { /* localStorage unavailable or full */ }
}

function removeItem(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch { /* localStorage unavailable */ }
}

function getJSON<T>(key: StorageKey): T | null {
  const raw = getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setJSON(key: StorageKey, value: unknown): void {
  setItem(key, JSON.stringify(value));
}

// ============================================================================
// Auth Token
// ============================================================================

export function getAuthToken(): string | null {
  return getItem(STORAGE_KEYS.AUTH_TOKEN);
}

export function setAuthToken(token: string): void {
  setItem(STORAGE_KEYS.AUTH_TOKEN, token);
}

export function clearAuthToken(): void {
  removeItem(STORAGE_KEYS.AUTH_TOKEN);
}

// ============================================================================
// Theme
// ============================================================================

export function getThemeMode(): string | null {
  return getItem(STORAGE_KEYS.THEME_MODE);
}

export function setThemeMode(mode: string): void {
  setItem(STORAGE_KEYS.THEME_MODE, mode);
}

export function getThemeName(): string | null {
  return getItem(STORAGE_KEYS.THEME_NAME);
}

export function setThemeName(name: string): void {
  setItem(STORAGE_KEYS.THEME_NAME, name);
}

// Legacy theme migration helper
export function migrateLegacyTheme(): string | null {
  try {
    const oldTheme = localStorage.getItem('theme');
    if (oldTheme) {
      setItem(STORAGE_KEYS.THEME_MODE, oldTheme);
      localStorage.removeItem('theme');
      return oldTheme;
    }
  } catch { /* ignore */ }
  return null;
}

// ============================================================================
// Chat Drafts
// ============================================================================

export function getChatDrafts(): Record<number, string> {
  return getJSON<Record<number, string>>(STORAGE_KEYS.CHAT_DRAFTS) ?? {};
}

export function saveChatDrafts(drafts: Record<number, string>): void {
  if (Object.keys(drafts).length === 0) {
    removeItem(STORAGE_KEYS.CHAT_DRAFTS);
  } else {
    setJSON(STORAGE_KEYS.CHAT_DRAFTS, drafts);
  }
}

// ============================================================================
// Column Visibility
// ============================================================================

export function getColumnVisibility(): string[] | null {
  return getJSON<string[]>(STORAGE_KEYS.COLUMN_VISIBILITY);
}

export function saveColumnVisibility(columns: string[]): void {
  setJSON(STORAGE_KEYS.COLUMN_VISIBILITY, columns);
}

export { STORAGE_KEYS };
