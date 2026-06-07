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
  // auth: login/register — already backed by per-IP brute-force lockout (isLockedOut),
  // so this tier only guards against IP-level flooding. Kept moderate to avoid blocking
  // shared-IP users (NAT / carrier / school WiFi).
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 20, blockDurationMs: 15 * 60 * 1000 },
  // connect: high-frequency machine-driven endpoint — shared IPs (NAT/carrier) can easily
  // have many simultaneous legitimate users, so we use a very generous limit.
  connect: { windowMs: 60 * 1000, maxRequests: 300, blockDurationMs: 2 * 60 * 1000 },
  // free-key: public page, not security-critical — allow reasonable browsing traffic.
  freeKey: { windowMs: 60 * 1000, maxRequests: 30, blockDurationMs: 5 * 60 * 1000 },
  public: { windowMs: 60 * 1000, maxRequests: 60, blockDurationMs: 5 * 60 * 1000 },
  authenticated: { windowMs: 60 * 1000, maxRequests: 120, blockDurationMs: 2 * 60 * 1000 },
  // keyGenerate: key creation costs saldo — limit to prevent abuse / accidental spam
  keyGenerate: { windowMs: 60 * 1000, maxRequests: 10, blockDurationMs: 5 * 60 * 1000 },
  // keyBulkOps: bulk delete / export — expensive operations, very strict
  keyBulkOps: { windowMs: 60 * 1000, maxRequests: 5, blockDurationMs: 10 * 60 * 1000 },
  // passwordChange: security-sensitive — strict per-user limit
  passwordChange: { windowMs: 60 * 60 * 1000, maxRequests: 5, blockDurationMs: 30 * 60 * 1000 },
  // admin: admin panel mutations — prevent accidental or malicious bulk operations
  admin: { windowMs: 60 * 1000, maxRequests: 30, blockDurationMs: 5 * 60 * 1000 },
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
      (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1]! < now - maxWindow)
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

export function checkUserRateLimit(
  userId: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  return checkRateLimit(`user:${userId}`, config);
}

export function getRateLimitTier(pathname: string): RateLimitConfig {
  if (
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/register' ||
    pathname.startsWith('/api/auth/telegram/callback')
  ) {
    return RATE_LIMIT_TIERS.auth;
  }
  if (
    pathname === '/api/free-key' ||
    pathname.startsWith('/api/free-key/')
  ) {
    return RATE_LIMIT_TIERS.freeKey;
  }
  if (pathname === '/api/connect') {
    return RATE_LIMIT_TIERS.connect;
  }
  if (
    pathname === '/api/server-status' ||
    pathname === '/api/download' ||
    pathname === '/api/auth/refresh' ||
    pathname.startsWith('/api/auth/telegram')
  ) {
    return RATE_LIMIT_TIERS.public;
  }
  if (
    pathname === '/api/store/webhook' ||
    pathname === '/api/telegram/webhook'
  ) {
    // Webhooks need high limits or bypass to avoid rate-limiting provider IPs under load
    return { windowMs: 60 * 1000, maxRequests: 1000, blockDurationMs: 60 * 1000 };
  }
  return RATE_LIMIT_TIERS.authenticated;
}

export function getUserRateLimitTier(pathname: string): RateLimitConfig | null {
  if (
    pathname === '/api/keys/generate' ||
    pathname === '/api/keys/extend' ||
    pathname === '/api/keys/reset'
  ) {
    return RATE_LIMIT_TIERS.keyGenerate;
  }
  if (
    pathname === '/api/keys/bulk-delete' ||
    pathname === '/api/keys/export'
  ) {
    return RATE_LIMIT_TIERS.keyBulkOps;
  }
  if (
    pathname === '/api/auth/change-password' ||
    pathname === '/api/auth/forgot-password' ||
    pathname === '/api/auth/reset-password'
  ) {
    return RATE_LIMIT_TIERS.passwordChange;
  }
  if (
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/api/users') ||
    pathname === '/api/game-settings' ||
    pathname === '/api/server-config'
  ) {
    return RATE_LIMIT_TIERS.admin;
  }
  return null;
}