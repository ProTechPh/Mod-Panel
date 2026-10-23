import type { NextConfig } from "next";

const insecureAdDevSources = process.env.NODE_ENV === 'development'
  ? ' http://cdn.cloudpiko.com http://cdn.cloudvideosa.com http://cdn.show-sb.com'
  : '';
const insecureImageDevSources = process.env.NODE_ENV === 'development' ? ' http:' : '';
const insecureGoogleStylesDevSource = process.env.NODE_ENV === 'development'
  ? ' http://fonts.googleapis.com'
  : '';
const insecureGoogleFontsDevSource = process.env.NODE_ENV === 'development'
  ? ' http://fonts.gstatic.com'
  : '';

const ContentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://challenges.cloudflare.com https://va.vercel-scripts.com https://bauval.org https://abscloud.org https://araplhn.org https://cdn.show-sb.com https://cdn.cloudpiko.com https://cdn.cloudvideosa.com https://static.nresystems.com${insecureAdDevSources}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com${insecureGoogleStylesDevSource}`,
  `img-src 'self' data: blob: https:${insecureImageDevSources}`,
  `font-src 'self' data: https://fonts.gstatic.com${insecureGoogleFontsDevSource}`,
  `connect-src 'self' https://challenges.cloudflare.com https://checkip.amazonaws.com https://bauval.org https://abscloud.org https://araplhn.org https://cdn.show-sb.com https://cdn.cloudpiko.com https://cdn.cloudvideosa.com https://mamshirt.com https://portalfluently.com https://static.nresystems.com${insecureAdDevSources}`,
  `frame-src 'self' https://challenges.cloudflare.com https://bauval.org https://abscloud.org https://araplhn.org https://cdn.show-sb.com https://cdn.cloudpiko.com https://cdn.cloudvideosa.com https://mamshirt.com https://portalfluently.com https://static.nresystems.com${insecureAdDevSources}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
].join("; ");

const nextConfig: NextConfig = {
  allowedDevOrigins: ['skillet-strike-eldest.ngrok-free.dev'],
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },
};

export default nextConfig;
