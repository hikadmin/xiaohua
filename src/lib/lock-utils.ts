/**
 * Lock Utility — PIN hashing, attempt tracking, lockout management
 * All operations use localStorage for Android PWA compatibility
 */

const STORAGE_KEYS = {
  PIN_HASH: 'luna_pin_hash',
  PIN_SALT: 'luna_pin_salt',
  ATTEMPTS: 'luna_lock_attempts',
  LOCKOUT_UNTIL: 'luna_lockout_until',
  APP_LOCK: 'luna_app_lock',
} as const;

const MAX_ATTEMPTS = 5;
const LOCKOUT_BASE_SECONDS = 30; // 30s for first lockout
const LOCKOUT_MULTIPLIER = 2;    // doubles each time

/** Generate a random salt (hex string) */
function generateSalt(): string {
  const arr = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    // Fallback for older browsers
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Hash PIN with salt using SHA-256 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = salt + pin + salt; // Double-salt for extra security
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback: simple hash for environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0') + salt.substring(0, 8);
}

/** Save PIN (hashed) to localStorage */
export async function savePin(pin: string): Promise<void> {
  const salt = generateSalt();
  const hash = await hashPin(pin, salt);
  try {
    localStorage.setItem(STORAGE_KEYS.PIN_HASH, hash);
    localStorage.setItem(STORAGE_KEYS.PIN_SALT, salt);
  } catch {}
}

/** Verify PIN against stored hash */
export async function verifyPin(pin: string): Promise<boolean> {
  try {
    const storedHash = localStorage.getItem(STORAGE_KEYS.PIN_HASH);
    const salt = localStorage.getItem(STORAGE_KEYS.PIN_SALT);
    if (!storedHash || !salt) return false;
    const hash = await hashPin(pin, salt);
    return hash === storedHash;
  } catch {
    return false;
  }
}

/** Check if a PIN is set */
export function isPinSet(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEYS.PIN_HASH);
  } catch {
    return false;
  }
}

/** Remove PIN from storage */
export function removePin(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PIN_HASH);
    localStorage.removeItem(STORAGE_KEYS.PIN_SALT);
    localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
  } catch {}
}

/** Set app lock enabled state */
export function setAppLockEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APP_LOCK, enabled ? 'true' : 'false');
  } catch {}
}

/** Check if app lock is enabled (localStorage only, for quick check) */
export function isAppLockEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.APP_LOCK) === 'true';
  } catch {
    return false;
  }
}

/** Record a failed attempt and return current attempt count */
export function recordFailedAttempt(): number {
  try {
    const current = parseInt(localStorage.getItem(STORAGE_KEYS.ATTEMPTS) || '0');
    const newCount = current + 1;
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, String(newCount));

    // If max attempts reached, set lockout
    if (newCount >= MAX_ATTEMPTS) {
      const lockoutCount = Math.floor(newCount / MAX_ATTEMPTS);
      const lockoutSeconds = LOCKOUT_BASE_SECONDS * Math.pow(LOCKOUT_MULTIPLIER, lockoutCount - 1);
      const lockoutUntil = Date.now() + lockoutSeconds * 1000;
      localStorage.setItem(STORAGE_KEYS.LOCKOUT_UNTIL, String(lockoutUntil));
    }

    return newCount;
  } catch {
    return 1;
  }
}

/** Reset failed attempts on successful unlock */
export function resetFailedAttempts(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
  } catch {}
}

/** Get remaining lockout time in seconds (0 = not locked out) */
export function getLockoutRemaining(): number {
  try {
    const lockoutUntil = parseInt(localStorage.getItem(STORAGE_KEYS.LOCKOUT_UNTIL) || '0');
    if (lockoutUntil <= Date.now()) {
      // Lockout expired, clear it
      localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
      return 0;
    }
    return Math.ceil((lockoutUntil - Date.now()) / 1000);
  } catch {
    return 0;
  }
}

/** Get remaining attempts before lockout */
export function getRemainingAttempts(): number {
  try {
    const attempts = parseInt(localStorage.getItem(STORAGE_KEYS.ATTEMPTS) || '0');
    return Math.max(0, MAX_ATTEMPTS - attempts);
  } catch {
    return MAX_ATTEMPTS;
  }
}

/** Format seconds to MM:SS */
export function formatLockoutTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
