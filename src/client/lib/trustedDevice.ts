/**
 * Per-browser device id, the stand-in for a MAC address (which browsers never
 * expose). Created once, kept in localStorage, and sent with every write. The
 * server remembers it after one successful password entry, so later writes
 * from this browser are accepted without the password.
 */
const STORAGE_KEY = "impulse-map.trusted-device";

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** The stored device id, or null when this browser has never written. */
export function getDeviceToken(): string | null {
  const store = storage();
  if (!store) return null;
  try {
    const value = store.getItem(STORAGE_KEY);
    return value && value.trim() ? value : null;
  } catch {
    return null;
  }
}

/** The stored id, creating and persisting one on first use. */
export function ensureDeviceToken(): string {
  const existing = getDeviceToken();
  if (existing) return existing;
  const created = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    storage()?.setItem(STORAGE_KEY, created);
  } catch {
    // Storage may be unavailable (private mode); the write still goes through,
    // the device just won't be remembered.
  }
  return created;
}

/** Whether this browser has an id to present (not whether the server trusts it yet). */
export function hasDeviceToken(): boolean {
  return getDeviceToken() !== null;
}

/** Stops presenting this browser as a known device. Trust server-side stays until cleaned up. */
export function clearDeviceToken(): void {
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do: there is simply nothing remembered.
  }
}
