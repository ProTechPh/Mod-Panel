# Mod Panel

Game mod license key management panel. Manage users, license keys, referrals, and game configurations.

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ProTechPh/Mod-Panel&env=MONGODB_URI,AUTH_SECRET,AUTH_REFRESH_SECRET,FTP_HOSTNAME,FTP_USERNAME,FTP_PASSWORD,FTP_PORT,FTP_REMOTE_PATH,NEXT_PUBLIC_TURNSTILE_SITE_KEY,TURNSTILE_SECRET_KEY,NEXT_PUBLIC_APP_NAME,NEXT_PUBLIC_APP_URL,LICENSE_KEY,ENCRYPTION_KEY,PASSWORD_LEGACY_SALT&envDescription=See%20.env.local.example%20for%20details&envLink=https://github.com/ProTechPh/Mod-Panel/blob/main/.env.local.example)

## Manual Setup

### 1. Clone & Install

```bash
git clone https://github.com/ProTechPh/Mod-Panel.git
cd Mod-Panel
pnpm install
```

### 2. Environment Variables

Copy the example and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string (MongoDB Atlas recommended) |
| `AUTH_SECRET` | ✅ | 32-byte hex string for JWT signing (`openssl rand -hex 32`) |
| `AUTH_REFRESH_SECRET` | ✅ | Different 32-byte hex string for refresh tokens |
| `FTP_HOSTNAME` | ✅ | FTP server hostname |
| `FTP_USERNAME` | ✅ | FTP username |
| `FTP_PASSWORD` | ✅ | FTP password |
| `FTP_PORT` | ✅ | FTP port (usually `21`) |
| `FTP_REMOTE_PATH` | ✅ | Remote directory for `.so` files (e.g. `/htdocs/onlinelibs/`) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ✅ | Cloudflare Turnstile site key ([get here](https://dash.cloudflare.com/?to=/:account/turnstile)) |
| `TURNSTILE_SECRET_KEY` | ✅ | Cloudflare Turnstile secret key |
| `NEXT_PUBLIC_APP_NAME` | ✅ | App name shown in UI |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your deployed URL (e.g. `https://mod-panel.vercel.app`) |
| `LICENSE_KEY` | ✅ | License key for mod client validation |
| `ENCRYPTION_KEY` | ✅ | 32-byte hex string for patch key encryption |
| `PASSWORD_LEGACY_SALT` | ⬜ | Salt for MD5+bcrypt password migration (only if migrating legacy passwords) |
| `RESHORTFLY_API_TOKEN` | ⬜ | ReShortFly API token for URL shortening in free key claims |
| `TRUSTED_PROXIES` | ⬜ | Comma-separated trusted proxy IPs (leave empty if not behind a proxy) |

### 3. Generate Secrets

```bash
# Generate AUTH_SECRET
openssl rand -hex 32

# Generate AUTH_REFRESH_SECRET
openssl rand -hex 32

# Generate ENCRYPTION_KEY
openssl rand -hex 32
```

### 4. MongoDB Setup

1. Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a database user (Database Access → Add New User)
3. Whitelist your IP (Network Access → Add IP Address) — or `0.0.0.0/0` for Vercel
4. Get your connection string (Database → Connect → Drivers)
5. Replace `<password>` with your database user's password

> **DNS SRV error on Windows?** If you get `querySrv ECONNREFUSED`, use the direct connection string format instead of `mongodb+srv://`. In Atlas, go to Database → Connect → "Drivers" → select "Node.js" → copy the connection string. If it still fails, replace `mongodb+srv://` with `mongodb://` and list the shard hosts manually (see `.env.local.example`).

### 5. FTP Setup

The panel stores `.so` library files on an FTP server:

1. Get an FTP host (e.g. [InfinityFree](https://infinityfree.com), or any FTP host)
2. Create the remote directory (e.g. `/htdocs/onlinelibs/`)
3. Fill in `FTP_HOSTNAME`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_PORT`, `FTP_REMOTE_PATH`

### 6. Cloudflare Turnstile (Captcha)

Used on the free key page to prevent abuse:

1. Go to [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
2. Create a new widget, select "Managed" challenge type
3. Copy the **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
4. Copy the **Secret Key** → `TURNSTILE_SECRET_KEY`

### 7. Run

```bash
# Development
pnpm dev

# Production build
pnpm build
pnpm start
```

## Deploy to Vercel

1. Push your repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. Add all environment variables from the table above
5. Deploy

Or use the button at the top of this README.

## Project Structure

```
app/
  (auth)/          # Login, register pages
  (panel)/         # Main panel (dashboard, keys, settings, etc.)
  (public)/        # Free key page
  api/             # API routes
components/        # Shared UI components
lib/
  db/models/       # Mongoose models
  services/        # Business logic
  validators/      # Zod schemas
  ftp/             # FTP client
  auth/            # JWT, password, Turnstile
types/             # TypeScript interfaces
```

## Roles

| Level | Role | Access |
|-------|------|--------|
| 1 | Owner | All pages including Users, Server Config |
| 2 | Admin | Dashboard, Keys, Settings, History, Referrals, Game Settings, Library |
| 3 | Reseller | Dashboard, Keys, Settings, History |

Registration requires a valid referral code. Referral codes are created by Owner or Admin.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run ESLint
```

## Credits

- **[ProTechPh](https://github.com/ProTechPh)** — Project creator & lead developer
- **[KenshinPH](https://github.com/KenshinPH)** — Core contributor

### Built With

- [Next.js](https://nextjs.org/) — React framework
- [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) — Database
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) — UI components
- [jose](https://github.com/panva/jose) — JWT authentication
- [basic-ftp](https://github.com/patrickjuchli/basic-ftp) — FTP client
- [Zod](https://zod.dev/) — Input validation
- [Lucide](https://lucide.dev/) — Icons
- [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) — Captcha

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 ProTechPh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
