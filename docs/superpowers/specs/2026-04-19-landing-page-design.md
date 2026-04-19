# Landing Page Design Spec

## Overview

Replace `app/page.tsx` (currently a redirect to `/login`) with a full landing page for Winter Panel. The page serves dual purpose: marketing new users toward registration, and providing existing users with server status and download access.

**Visual direction:** Dark luxury — deep dark backgrounds, premium typography, subtle glass surfaces, intentional hierarchy.

**Animation:** Heavy GSAP + ScrollTrigger choreography — parallax, staggered reveals, 3D hover effects, counter animations, grain texture.

## Architecture

### Routing

- `app/page.tsx` renders `<LandingPage />` instead of redirecting
- Uses the existing `(public)` layout (ThemeProvider only, no Navbar/Sidebar)
- Landing page is a standalone surface — no panel chrome

### Component Structure

```
app/page.tsx                  → server component, renders <LandingPage />
components/landing/
  ├── LandingPage.tsx          → client orchestrator, scroll container
  ├── Hero.tsx                 → hero section with CTA
  ├── Features.tsx             → mod feature bento grid
  ├── ServerStatus.tsx          → live server status display
  ├── Download.tsx              → download links section
  └── Footer.tsx                → branding + links
hooks/
  └── useGsapScroll.ts         → ScrollTrigger registration + cleanup hook
```

All animated components are `"use client"`. The `page.tsx` stays as a server component that renders the client `LandingPage`.

### Dependencies

- `gsap` — core animation engine
- `@gsap/react` — official React adapter with `useGSAP` hook for safe cleanup and context scoping

## Sections

### 1. Hero

**Visual:** Full-viewport dark luxury hero. Deep dark background (`oklch(0.08 0 0)`) with subtle grain/noise texture overlay. App name "Winter Panel" in large display type (Geist Sans, ultra-bold, scale-contrasted). Tagline below in muted foreground.

**Animation sequence (on load):**
1. Background grain fades in
2. Title reveals letter-by-letter with stagger
3. Tagline fades up with 0.3s delay
4. CTA buttons slide up from below with stagger
5. Subtle floating gradient orbs drift in the background (CSS animated, not GSAP)

**CTAs:**
- "Get Started" — primary button, links to `/register`
- "Login" — secondary/outline button, links to `/login`
- Both use existing shadcn Button component

**Scroll effect:** Hero content parallax-fades upward and scales down slightly as user scrolls — GSAP ScrollTrigger scrub.

### 2. Features Showcase

**Visual:** Bento-style grid layout — varied card sizes for hierarchy. 3-4 larger "hero features" (ESP, Aim, Silent Aim) with icon + short description. Smaller supporting features (Item, BulletTrack, Memory, Floating, Setting) in a compact row.

**Cards:** Dark glassmorphic — `backdrop-blur`, subtle border (`oklch(1 0 0 / 8%)`), slight inner glow on hover. Each card has:
- Lucide icon (top-left)
- Feature name (bold)
- One-line description

**Animation:**
- Staggered reveal on scroll — each card slides up + fades in with 0.08s stagger
- On hover: subtle 3D tilt (CSS `perspective` + `rotateX/Y` via GSAP `quickTo`)

**Data source:** Hardcoded from `Features` type in `types/index.ts`. No API call — static showcase content.

### 3. Server Status

**Visual:** Compact status panel showing:
- Server status indicator (green dot = active, red = maintenance)
- Active players / total slots
- Current game version
- Maintenance status

**Data source:** New public API route `/api/server-status` — returns status without auth. Must be added to public paths in `proxy.ts`. Reads from `ServerConfig` model.

**Animation:**
- Counter animation for player count (GSAP `countTo`)
- Pulse animation on the status dot
- Staggered reveal of each stat item

**Design:** Horizontal stat cards on desktop, stacked on mobile. Each stat in a mini glass card with glow accent based on status (green = active, amber = maintenance).

### 4. Download

**Visual:**
- Platform download buttons (Android APK link from existing `AppLink` model)
- Requirements/info text (Android version, etc.)
- GSAP scroll-triggered reveal — buttons slide up from below

### 5. Footer

**Visual:**
- App branding (Winter Panel logo/name)
- Navigation links (Login, Register, Telegram support)
- Copyright line
- Subtle top border, muted foreground text

**Animation:** Simple fade-up reveal on scroll. No heavy animation — footer is the landing page's denouement.

## New API Route

### `/api/server-status` (public, no auth)

Returns:
```json
{
  "success": true,
  "data": {
    "status": "active",
    "maintenance": "off",
    "activePlayers": 142,
    "totalSlots": 500,
    "version": "3.2.1"
  }
}
```

Must be added to public paths in `proxy.ts` alongside `/api/free-key` and `/api/connect`.

## Technical Notes

- All GSAP animations use `useGSAP` from `@gsap/react` for proper React 18 concurrent mode safety and automatic cleanup
- ScrollTrigger registered once in `useGsapScroll` hook, cleaned up on unmount
- Grain/noise texture via CSS `background-image` with a tiny inline SVG data URI — no external asset needed
- Gradient orbs are pure CSS `@keyframes` — not GSAP — to keep them lightweight and always running
- 3D tilt on feature cards uses GSAP `quickTo` for performant mouse-tracking transforms
- Responsive: all sections adapt to mobile (stacked layouts, reduced animation intensity via `prefers-reduced-motion`)
- Dark mode only for landing page — no light theme toggle (fits the luxury aesthetic)