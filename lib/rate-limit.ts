/**
 * Edge-compatible in-memory sliding window rate limiter.
 * Uses Map for storage — state resets on isolate recycle (acceptable for single-server).
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs: number;
}

interface RateLimitEntry {
  timestamps: number[];
  blockedUntil: number;
}

export const RATE_LIMIT_TIERS = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10, blockDurationMs: 30 * 60 * 1000 },
  public: { windowMs: 60 * 1000, maxRequests: 60, blockDurationMs: 5 * 60 * 1000 },
  authenticated: { windowMs: 60 * 1000, maxRequests: 120, blockDurationMs: 2 * 60 * 1000 },
} as const;

const store = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 10_000;
const CLEANUP_THRESHOLD = 8_000;

function cleanup(now: number) {
  if (store.size < CLEANUP_THRESHOLD) return;
  const maxWindow = 30 * 60 * 1000;
  for (const [key, entry] of store) {
    if (
      entry.blockedUntil < now &&
      entry.timestamps.length === 0 &&
      entry.timestamps[entry.timestamps.length - 1]! < now - maxWindow
    ) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(
  ip: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  cleanup(now);

  const entry = store.get(ip);

  if (!entry) {
    store.set(ip, { timestamps: [now], blockedUntil: 0 });
    return { allowed: true, remaining: config.maxRequests - 1, retryAfterMs: 0 };
  }

  if (entry.blockedUntil > now) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.blockedUntil - now };
  }

  const windowStart = now - config.windowMs;
  entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

  if (entry.timestamps.length >= config.maxRequests) {
    entry.blockedUntil = now + config.blockDurationMs;
    return { allowed: false, remaining: 0, retryAfterMs: config.blockDurationMs };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: config.maxRequests - entry.timestamps.length, retryAfterMs: 0 };
}

export function getRateLimitTier(pathname: string): RateLimitConfig {
  if (
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/register' ||
    pathname === '/api/free-key' ||
    pathname.startsWith('/api/auth/telegram/callback')
  ) {
    return RATE_LIMIT_TIERS.auth;
  }
  if (
    pathname === '/api/connect' ||
    pathname === '/api/server-status' ||
    pathname === '/api/download' ||
    pathname === '/api/auth/refresh' ||
    pathname.startsWith('/api/auth/telegram')
  ) {
    return RATE_LIMIT_TIERS.public;
  }
  return RATE_LIMIT_TIERS.authenticated;
}