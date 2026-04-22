/**
 * In-memory brute-force protection for auth endpoints.
 * Progressive delay: 500ms base, doubles per attempt.
 * Lockout after 5 failed attempts for 15 minutes.
 */

interface FailedAttempt {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const PROGRESSIVE_BASE_DELAY_MS = 500;
const MAX_ENTRIES = 5000;

const failedAttempts = new Map<string, FailedAttempt>();

export function recordFailedAttempt(ip: string): { locked: boolean; delayMs: number } {
  const now = Date.now();
  let entry = failedAttempts.get(ip);

  if (!entry) {
    failedAttempts.set(ip, { count: 1, firstAttemptAt: now, lockedUntil: 0 });
    return { locked: false, delayMs: PROGRESSIVE_BASE_DELAY_MS };
  }

  if (entry.lockedUntil > 0 && entry.lockedUntil <= now) {
    entry.count = 1;
    entry.firstAttemptAt = now;
    entry.lockedUntil = 0;
    return { locked: false, delayMs: PROGRESSIVE_BASE_DELAY_MS };
  }

  if (entry.lockedUntil > now) {
    return { locked: true, delayMs: entry.lockedUntil - now };
  }

  entry.count += 1;

  const delayMs = PROGRESSIVE_BASE_DELAY_MS * Math.pow(2, Math.min(entry.count - 1, 5));

  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    return { locked: true, delayMs: LOCKOUT_DURATION_MS };
  }

  return { locked: false, delayMs };
}

export function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

export function isLockedOut(ip: string): { locked: boolean; remainingMs: number } {
  const entry = failedAttempts.get(ip);
  if (!entry || entry.lockedUntil <= Date.now()) {
    return { locked: false, remainingMs: 0 };
  }
  return { locked: true, remainingMs: entry.lockedUntil - Date.now() };
}

export function cleanupBruteForce(): void {
  if (failedAttempts.size < MAX_ENTRIES) return;
  const now = Date.now();
  for (const [ip, entry] of failedAttempts) {
    if (entry.lockedUntil <= now && now - entry.firstAttemptAt > LOCKOUT_DURATION_MS) {
      failedAttempts.delete(ip);
    }
  }
}