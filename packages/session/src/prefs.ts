export const PREFS_KEY = "workshell.prefs.v1";

export type PrefsV1 = { version: 1; theme: string };

export function readPrefs(storage: Storage): PrefsV1 | null {
  const raw = storage.getItem(PREFS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { version?: unknown; theme?: unknown };
    if (parsed?.version !== 1) return null;
    if (typeof parsed.theme !== "string" || !parsed.theme) return null;
    return { version: 1, theme: parsed.theme };
  } catch {
    return null;
  }
}

export function writePrefs(storage: Storage, theme: string): void {
  storage.setItem(PREFS_KEY, JSON.stringify({ version: 1, theme }));
}
