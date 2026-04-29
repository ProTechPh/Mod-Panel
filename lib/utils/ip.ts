import { NextRequest } from 'next/server';

/**
 * Extract the real client IP from request headers, validating against
 * trusted proxy IPs.
 *
 * When TRUSTED_PROXIES is configured, walks x-forwarded-for from right
 * to left, skipping trusted proxies, and returns the first untrusted IP.
 * When not configured, returns the leftmost x-forwarded-for IP.
 */
export function extractClientIp(request: NextRequest, trustedProxies: string[]): string {
  const forwarded = request.headers.get('x-forwarded-for');

  if (forwarded && trustedProxies.length > 0) {
    const ips = forwarded.split(',').map(ip => ip.trim()).filter(Boolean);
    for (let i = ips.length - 1; i >= 0; i--) {
      if (!trustedProxies.includes(ips[i])) {
        return ips[i];
      }
    }
    return ips[0] || 'unknown';
  }

  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim()).filter(Boolean);
    return ips[0] || 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;


  // Generate a random ID if 'unknown' to avoid punishing all users for one IP parsing failure
  return 'unknown-' + Math.random().toString(36).substring(2, 9);
}