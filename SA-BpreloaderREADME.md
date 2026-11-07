# SA brand: preloader + logo handoff (for Claude Code)

This package adds two things to Shayan Ahmed's portfolio (Next.js App Router, TypeScript, Tailwind):

1. **The intro preloader.** The approved design is "crop-mark entry + measured exit".
2. **The final SA logo.** It goes in the navbar badge, the favicon set and the app icons.

The O·3 hero is already built from `HERO_BUILD_BRIEF.md`. Do not restyle it. This brief only adds the intro on top of it, plus one reveal class on hero elements.

```
SA-Brand/
├─ README.md                      ← this brief
├─ preloader/
│  └─ preloader-reference.html    ← SOURCE OF TRUTH for motion. Open it in a browser.
├─ code/
│  └─ SALogo.tsx                  ← drop-in logo component (badge / keycap / mono)
└─ logo/
   ├─ svg/      sa-keycap.svg · sa-badge.svg · sa-app-square.svg · sa-monogram-{copper,cream,ink}.svg
   ├─ png/      keycap 128–1024 · badge 64–512 · monograms 1240w
   └─ favicon/  favicon.ico (16/32/48) · icon.svg · apple-icon.png (180) · icon-192.png · icon-512.png
```

---

## Part 1: Preloader

### 1.1 What it does (1.66 s, first visit per session only)

1. A dark cutting-mat grid covers the page.
2. Four copper crop marks slide in to frame the centre, and a small registration mark fades in above them.
3. "SHAYAN AHMED" rises into the frame. It uses the same condensed copper Archivo as "THE BUILD".
4. A copper ruler line draws across the screen with tick marks. A counter (0 → 100) rides its tip, and the line is the progress bar.
5. The screen splits along the line. The top half (name, top marks) slides up and the bottom half (captions, bottom marks) slides down. The hero, already rendered underneath, eases in.

**Open `preloader/preloader-reference.html` before writing code.** Use Replay and Slow ×4 to watch it. Every keyframe, easing and delay in it has been checked frame by frame. Port its CSS **verbatim**; do not re-derive the values.

### 1.2 Timeline (ms, at normal speed)

The reference multiplies every duration and delay by `var(--t)`. It is a debugging speed control, so set `--t: 1` in production.

| Element | Animation | Start | Duration | Easing |
|---|---|---|---|---|
| 4 crop marks | `mIn`: from `translate(±70px, ±70px)`, opacity 0 → in place | 40 | 560 | `cubic-bezier(.2,.8,.2,1)` |
| Registration mark | fade in | 160 | 360 | `ease` |
| Ruler line | `scaleX(0 → 1)`, origin left | 140 | 840 | `cubic-bezier(.5,0,.3,1)` |
| Ticks (24 px minor, 120 px major) | `clip-path: inset(0 100% 0 0) → inset(0)` | 140 | 840 | same as line |
| Counter | `--n: 0 → 100` (`@property` integer); rides the line tip | 140 | 840 | same as line |
| "SHAYAN" | `lift`: `clip-path: inset(0 0 100% 0)` + `translateY(24px)` → none | 220 | 620 | `cubic-bezier(.2,.8,.2,1)` |
| "AHMED" | `lift` | 300 | 620 | same |
| Captions (top and bottom mono rows) | fade in | 560 | 380 | `ease` |
| Ruler line | fade out | 1040 | 160 | linear |
| Top half | `translateY(-100%)` | 1040 | 620 | `cubic-bezier(.76,0,.24,1)` |
| Bottom half | `translateY(100%)` | 1040 | 620 | same |
| Hero reveal (`rvIn`: `translateY(16px)`, opacity 0 → none) | THE BUILD 1100 · issue line + name line 1140 · left column 1200 · "What's built in" 1260 | — | 620 | `cubic-bezier(.2,.8,.2,1)` |
| Unmount overlay | after the bottom half's `animationend` | ≈1660 | — | — |

The navbar and the SA badge in the nav do **not** animate. They are revealed by the split.

### 1.3 Build approach

Use **CSS keyframes** ported from the reference, driven by one React state machine. Do not rebuild the timeline in Motion: the CSS version is the verified one, and it runs on the compositor with no JS per frame.

- `components/preloader/Preloader.tsx` (`"use client"`) holds the overlay markup: two halves plus the line. Copy the structure from `.ov` in the reference.
- `components/preloader/preloader.module.css` holds the keyframes and classes from the reference's `<style>`, under `/* intro timeline */`.
- `app/layout.tsx` renders `<IntroGate />` (an inline script, see 1.4) in `<head>`, and `<Preloader />` as the first child of `<body>`.

States are `idle → playing → holding (only if not ready) → splitting → done`. On `done`, unmount the overlay, remove `data-intro` from `<html>` and restore scrolling.

### 1.4 First visit only, with no flash

Put this inline in `<head>` so it runs before first paint, through `next/script` with `strategy="beforeInteractive"` or a plain `<script dangerouslySetInnerHTML>`:

```js
(function () {
  try {
    var d = document.documentElement;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || sessionStorage.getItem('sa:intro')) { d.dataset.intro = 'skip'; return; }
    sessionStorage.setItem('sa:intro', '1');
    d.dataset.intro = 'play';
  } catch (e) { document.documentElement.dataset.intro = 'skip'; }
})();
```

- Server-render the overlay. Hide it with `html[data-intro="skip"] .preloader { display: none }` so returning visitors never see a frame of it.
- Hero reveal classes animate only under `html[data-intro="play"]`. Under `skip`, the hero is static and fully visible.
- While playing, set `overflow: hidden` on `<html>`. Remove it on `done`.

### 1.5 The counter must be real

The line and counter are a progress bar, so they must not finish before the page is ready.

- **Ready** means all three of these:
  - `document.fonts.load('900 150px <Archivo family>')` has resolved.
  - `document.fonts.load('500 12px <JetBrains Mono family>')` has resolved.
  - The hero's largest image (if any) has finished `decode()`.
- Run the line from 0 to **92 %** over 140 → 900 ms: `scaleX(.92)`, counter 92.
- If ready by 900 ms, finish 92 → 100 % over 140 ms, then start the split.
- If not ready, hold at 92 % and finish when ready.
- **Hard cap:** if nothing is ready by 3000 ms, finish anyway. Never strand the visitor.
- With next/font, read the generated family name from the CSS variable (`getComputedStyle(document.documentElement).getPropertyValue('--font-archivo')`). Do not hardcode "Archivo".

### 1.6 Skip

Any click, tap or key press during `playing` or `holding` jumps straight to `splitting` from the current frame. Start the split immediately and do not finish the line. Add the listeners on mount and remove them on `done`.

### 1.7 Responsive

The reference is drawn on a 1440 × 1040 frame. Make it fluid like this:

| Property | Rule |
|---|---|
| Split line | `top: 50svh`. Each half is `50svh` tall. |
| Name size | `font-size: clamp(48px, 13.8vw, 150px)`. The name is about 5.77 × font-size wide, so it always fits the frame. |
| Frame (crop-mark box) | `width: min(1000px, 100vw - 32px)`, centred. Height 380 px desktop, 300 px under 640 px. |
| Crop marks | 28 px arms, 1.5 px copper. 20 px arms under 640 px. They sit 10 px outside the frame corners. |
| Captions | Top row: `NO. 01 — PORTFOLIO` … `NOVEMBER 2026`. Bottom row: `FULL-STACK DEVELOPER` · `WEBSITES · SYSTEMS · AGENTS` · `PAKISTAN`. Under 640 px, drop the middle bottom caption. Keep mono at 11 px (10 px on mobile). |
| Ticks and counter | Unchanged. The tick pattern is a `repeating-linear-gradient`, so it scales for free. |

Test at 1440 × 900, 1280 × 800, 1024 × 768, 768 × 1024, 390 × 844 and 360 × 740.

### 1.8 Fonts

```ts
import { Archivo, JetBrains_Mono } from 'next/font/google';
export const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });
export const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['500'], variable: '--font-mono', display: 'swap' });
```

The name uses `font-weight: 900; font-stretch: 62%; font-variation-settings: 'wdth' 62`, exactly as "THE BUILD" does. `next/font` preloads by default; keep it. The readiness gate in 1.5 means the name never shows in a fallback font.

### 1.9 Accessibility

- The overlay is `aria-hidden="true"` and `pointer-events: none` (except for the skip listener on `window`). The real content stays readable underneath.
- `prefers-reduced-motion: reduce` means no preloader at all (handled in 1.4) and no hero reveal.
- Do not move focus or trap it.

### 1.10 Acceptance checklist

- [ ] Side by side at 1440 × 1040, the result matches `preloader-reference.html` at 300 / 700 / 1300 / 2000 ms. Pause both with `document.getAnimations()`.
- [ ] Second load in the same tab: no preloader, no flash, hero static.
- [ ] Reduced motion on: no preloader.
- [ ] Throttled "Slow 4G": the line holds at 92 %, completes when fonts arrive, and gives up at 3 s.
- [ ] A click during the intro splits immediately.
- [ ] No horizontal scroll at 360 px. The name stays inside the crop marks at every listed size.
- [ ] Lighthouse: the overlay does not count as LCP. The hero heading is server-rendered underneath, so this holds.

---

## Part 2: Logo

### 2.1 Variants

| Variant | File | Use |
|---|---|---|
| **Badge** (flat tile) | `sa-badge.svg` / `<SALogo />` | Navbar (38 px), favicons, anything **under 64 px** |
| **Keycap** (graphite, dimensional) | `sa-keycap.svg` / `<SALogo variant="keycap" />` | **64 px and up**: about section, footer, OG image, social avatar |
| **Monogram, copper** | `sa-monogram-copper.svg` / `variant="mono"` | Dark backgrounds only |
| **Monogram, cream** | `sa-monogram-cream.svg` / `variant="mono" tone="cream"` | Dark backgrounds, one-colour |
| **Monogram, ink** | `sa-monogram-ink.svg` / `variant="mono" tone="ink"` | **Light backgrounds** (the copper loses contrast on cream) |
| App square | `sa-app-square.svg` → `apple-icon.png` | iOS home screen (iOS rounds the corners itself) |

All letterforms are outlined paths. Nothing depends on a font or a stroke, so the files render the same everywhere.

### 2.2 Install

1. Copy `logo/favicon/favicon.ico`, `icon.svg` and `apple-icon.png` into `app/`. Next.js picks them up automatically.
2. Copy `icon-192.png` and `icon-512.png` into `public/` and reference them from `app/manifest.ts`, with `theme_color: '#120C08'` and `background_color: '#120C08'`.
3. Copy `code/SALogo.tsx` to `components/brand/SALogo.tsx`.
4. In the navbar, replace the current badge with `<SALogo size={38} />`. Keep the existing wrapper link, the "Shayan Ahmed" text and the "FULL-STACK DEVELOPER" sub-label exactly as they are.
5. Copy `logo/svg/*` and `logo/png/*` to `public/brand/` for OG images and anything else.

### 2.3 Rules

- **Clear space:** keep at least a quarter of the logo's width empty around it.
- **Minimum sizes:**
  - Badge: 16 px.
  - Keycap: 64 px. Below that, its bevel turns to mud, so switch to the badge.
  - Monogram: 20 px tall.
- Do not recolour the copper gradient, add glows or shadows, or rotate the logo. Do not set "SA" in a font in its place: the S and A are custom-drawn.
- **Colours:**
  - Ink `#120C08`
  - Tile `#1E150F`
  - Copper `#E8B27A`
  - Copper gradient `#FBE3C2 → #E8B07A → #C98C55 → #9E6034`
  - Cream `#F3EADB`
