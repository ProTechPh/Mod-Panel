# Mod Panel — Design System (Tactical Console v2)

Single source of truth for the panel's visual language. Everything in the UI should be
derived from the tokens and primitives below. Do not introduce a second palette.

**Identity:** dark metallic charcoal surfaces, warning-orange signal accent, mono HUD
typography for machine data, Syne for display headings, Geist for body copy.

---

## 1. Colour

All colours live as CSS custom properties. Raw tokens are declared in
`app/panel-system.css` (`:root`); `app/globals.css` maps the shadcn contract onto them, so
Tailwind utilities (`bg-card`, `text-muted-foreground`, `border-border`, …) resolve to the
same values.

### Surfaces
| Token | Value | Use |
| --- | --- | --- |
| `--bg-void` | `#07080a` | page background |
| `--bg-deep` | `#0b0c10` | sidebars, topbar |
| `--bg-card` | `rgba(20,22,30,0.72)` | glass panels |
| `--bg-card-2` | `#181a24` | popovers, dropdowns |
| `--bg-solid` | `#14161e` | opaque cards, table headers |
| `--bg-inset` | `rgba(0,0,0,0.24)` | inset fields, table head, footers |

### Brand (orange)
`--brand-900 #7c2d12` · `--brand-700 #c2410c` · `--brand-600 #ea580c` · `--brand-500 #f97316`
· `--brand-400 #fb923c` · `--brand-300 #fdba74` · `--brand-glow #facc15`

Legacy aliases `--teal-1..3` / `--teal-neon` still resolve to the brand ramp. They are kept
only so existing rules keep working — **write new code with `--brand-*`**.

### Status
`--ecto-green #22c55e` (+ `--green-soft #86efac` for text) · `--gold #eab308`
(+ `--gold-soft #fcd34d`) · `--red #ef4444` (+ `--red-soft #fca5a5`) · `--purple #a78bfa`.

### Text
`--text-hi #f1f5f9` (primary) · `--text-mid #a3aebf` (secondary) · `--text-lo #7c8694`
(tertiary/labels). All three clear 4.5:1 against the void background.

### Lines
`--border` = `rgba(255,255,255,0.07)` (owned by `globals.css`, single definition),
`--border-hi` = `rgba(255,255,255,0.12)` for inputs and emphasised edges.

**Never hardcode a hex in a component.** If a new shade is genuinely needed, add a token.

---

## 2. Typography

| Role | Font | Notes |
| --- | --- | --- |
| Display / headings | `--ff-display` (Syne) | `font-heading`, bold, tight tracking |
| Body / UI | `--ff-body` (Geist Sans) | default `font-sans` |
| Data / labels / keys | `--ff-mono` (Geist Mono) | `font-mono`, uppercase + tracking for eyebrows |

`--font-sans`, `--font-mono`, `--font-heading` in `globals.css` point at the next/font
variables. Eyebrows are `12px`/`0.7rem` mono, uppercase, `0.16em–0.2em` tracking, orange.

---

## 3. Geometry & motion

- Radius: `--radius: 0.5rem`. `rounded-lg` = 8px = `.panel`. Cards, inputs and buttons share it.
- Spacing: 4px scale. Page gutters `p-4 md:p-6 lg:p-7`; section gap `space-y-6`.
- Panel shadow `--shadow-panel`, lifted dialogs `--shadow-lift`.
- Motion: `--dur-fast 150ms`, `--dur-base 220ms`, `--dur-slow 320ms`, `--ease-out-expo`.
  Hover effects stay within 150–320ms. Ambient orbs are the only long-running animation and
  are disabled under `prefers-reduced-motion`.

---

## 4. Primitives

| Class / component | Purpose |
| --- | --- |
| `.panel`, `.panel-head`, `.panel-title`, `.panel-badge`, `.panel-corner` | glass surface + 2px top hairline |
| `.stat-card` | metric tile with accent wash |
| `.page-header` (+ `-eyebrow`, `-title`, `.highlight`, `-sub`, `-actions`) | every page's title block |
| `.btn-primary`, `.btn-outline`, `.cmd-btn*` | legacy buttons; prefer `<Button>` |
| `.field`, `.field-label`, `.field-hint`, `.field-error` | form rows |
| `.surface`, `.surface-inset` | neutral containers |
| `.section`, `.section-head`, `.section-title` | content grouping |
| `.empty-state` + `.empty-icon-ring`, `.empty-title`, `.empty-sub` | empty results |
| `.state-screen` / `.state-card` / `.state-btn` | full-page 404, error, access-denied |
| `.nav-link`, `.nav-link--active`, `.nav-section-label` | sidebar navigation |
| `.toolbar`, `.kbd`, `.skeleton`, `.focus-ring` | utilities |

shadcn primitives (`components/ui/*`) are restyled to match: `Card` is the glass panel,
`Button` is the hazard plate, `Badge` is a mono pill, tables carry the console skin via
`[data-slot]` rules.

**Page skeleton**

```tsx
<PageHeader
  eyebrow="[ SECTION / CONTEXT ]"
  title="Keys"
  highlight="active"
  sub="What this page does in one line."
  actions={<Button>Generate</Button>}
/>
<div className="space-y-6">{/* panels */}</div>
```

One `<h1>` per page — owned by `PageHeader`. The topbar wordmark is a `<span>` for this
reason.

---

## 5. Rules

1. **Orange is the only accent.** Purple/fuchsia/cyan gradients are banned.
2. Icons come from `lucide-react`; no emoji, no decorative glyphs.
3. Every clickable gets `cursor-pointer` and a visible `:focus-visible` ring.
4. Status colours only come from `StatusBadge` or the status tokens.
5. Charts: `#f97316` primary series, `#a78bfa`, `#22c55e`, `#eab308`, `#ef4444` secondary.
   Recharts cannot read `var()` in SVG attributes — pass literal hexes there.
6. Numeric data uses `font-mono` + `tabular-nums`.
7. Loading uses `.loading-spinner`; it keeps spinning under reduced motion on purpose.
8. Responsive breakpoints to verify: 375 / 768 / 1024 / 1440.

---

## 6. Pre-delivery checklist

- [ ] 4.5:1 text contrast on every surface
- [ ] keyboard reachable, visible focus
- [ ] `prefers-reduced-motion` respected
- [ ] no hardcoded colours or magic radii
- [ ] no emoji icons
- [ ] hover transitions 150–320ms
- [ ] layout holds at 375px wide
