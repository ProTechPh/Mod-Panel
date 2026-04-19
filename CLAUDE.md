# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Winter Panel (Mod Panel)** — a game mod license key management panel built with Next.js 16 App Router. Manages users, license keys, referrals, and game configurations for a mod distribution system.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run ESLint
```

No test framework is configured. No test commands exist.

## Architecture

### Route Groups

- `(auth)/` — Login, register (centered card layout, ThemeProvider only)
- `(panel)/` — Main panel pages (Navbar + Sidebar + AuthProvider)
- `(public)/` — Free key page (ThemeProvider only)
- `auth/telegram/callback/` — Telegram OAuth handler

### Middleware / Edge Proxy

`proxy.ts` is the Edge middleware (not `middleware.ts`). It:
- Allows public pages: `/`, `/login`, `/register`, `/connect`, `/free-key`, `/download`
- Allows public APIs: `/api/auth/*` (login/register/refresh/telegram), `/api/connect`, `/api/free-key`
- Protects all other routes via JWT verification on `wp_access` cookie
- Injects `x-user-id`, `x-username`, `x-user-level` headers for downstream handlers
- Enforces role-based access: Owner (level 1) only for `/admin/users` and `/admin/private-dashboard`; Admin+ (level 1-2) for `/admin/referrals` and `/admin/game-settings`

### Authentication

Custom JWT system using `jose` (not NextAuth):
- **Access token**: 6h TTL, HS256, signed with `AUTH_SECRET`
- **Refresh token**: 7d TTL, HS256, signed with `AUTH_REFRESH_SECRET`
- **Cookies**: `wp_access` (httpOnly, secure in prod) and `wp_refresh`
- **Password**: bcryptjs with legacy MD5+bcrypt migration via `PASSWORD_LEGACY_SALT`
- **Telegram auth**: HMAC-SHA256 verification of Telegram Login Widget data

### Database

MongoDB via Mongoose 9 with a global-cached singleton connection (`lib/db/connection.ts`). 8 models in `lib/db/models/`:

| Model | Collection | Notes |
|-------|-----------|-------|
| User | `users` | level 1=Owner, 2=Admin, 3=Reseller; status 1=Active, 2=Banned, 3=Expired |
| Key | `keys` | status 0=Inactive, 1=Active; duration in days or '1h'/'6h'; maxDevices enforcement |
| Referral | `referrals` | MD5-hashed codes; links to creator and users |
| GameSetting | `game_settings` | Per-game config with feature flags (esp, item, silentAim, aim, bulletTrack, memory, floating, setting) |
| ServerConfig | `server_config` | Singleton doc (fixed ObjectId `000000000000000000000001`) |
| IpTracker | `ip_tracker` | VPN/proxy detection for free key abuse prevention |
| History | `history` | Action log |
| AppLink / Lib | `app_links` / `libs` | Download links and .so file metadata |

All models use `mongoose.models.X || mongoose.model()` pattern for hot-reload safety.

### Service Layer

Business logic lives in `lib/services/` — each service handles its domain (key generation with saldo deduction, device slot enforcement, token generation, DataTables-compatible listing, caching, etc.). API route handlers are thin wrappers that call services and return JSON.

Key service details:
- `key-service.ts` has in-memory 1-minute TTL cache for `ServerConfig` and `GameSetting`
- `free-key-service.ts` uses Cloudflare Turnstile + ip-api.com VPN detection + IP rate limiting (1 key/hour)
- `lib-service.ts` manages `.so` files via FTP (`basic-ftp`) + MongoDB metadata

### Validation

All input validation uses **Zod v4** (import from `zod/v4`, not `zod`). Schemas in `lib/validators/`.

### Types

Central type definitions in `types/index.ts` — document interfaces, role/status constants, `JwtPayload`, `Features` flags, and the `STATIC_WORDS` constant used in token generation.

## Key Conventions

- **Package manager**: pnpm (workspace configured in `pnpm-workspace.yaml`)
- **UI**: shadcn/ui (base-nova style) + Tailwind CSS v4 + Lucide icons
- **Forms**: react-hook-form + Zod v4 resolvers
- **Tables**: @tanstack/react-table for data tables
- **Notifications**: sonner
- **Theme**: next-themes (dark/light via ThemeProvider)
- **Path alias**: `@/*` maps to project root (e.g., `@/lib/`, `@/components/`)
- **No `src/` directory** — code lives at project root level (`app/`, `lib/`, `components/`, `types/`)

## Role-Based Access

| Level | Role | Access |
|-------|------|--------|
| 1 | Owner | All pages including Users, Server Config, Private Dashboard |
| 2 | Admin | Dashboard, Keys, Download, Settings, History, Referrals, Game Settings, Library |
| 3 | Reseller | Dashboard, Keys, Download, Settings, History |

## API Route Pattern

All API routes follow this pattern:
1. Extract user identity from headers (`x-user-id`, `x-user-level`) set by middleware
2. Validate input with Zod schemas from `lib/validators/`
3. Call service layer functions
4. Return JSON response with `{ success, data?, error? }` shape

## Environment Variables

Required (see `.env.local.example`):
- `MONGODB_URI`, `AUTH_SECRET`, `AUTH_REFRESH_SECRET` — core infrastructure
- `FTP_*` — file storage for .so libraries
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` — captcha on free-key page
- `PASSWORD_LEGACY_SALT` — backward-compatible password migration
- `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL` — app branding
- `LICENSE_KEY` — mod client validation
- `NEXT_PUBLIC_TELEGRAM_BOT_ID`, `TELEGRAM_BOT_TOKEN` — Telegram OAuth

## Important Notes

- `proxy.ts` serves as the Edge middleware. If you create a `middleware.ts`, it may conflict.
- Zod is v4 — always import from `zod/v4`, not `zod`.
- The `ServerConfig` document uses a fixed ObjectId constant `SERVER_CONFIG_ID`.
- Key token generation uses MD5 hashing with `STATIC_WORDS` from types — this is the mod client validation protocol.
- FTP operations are for `.so` library files stored on InfinityFree hosting.