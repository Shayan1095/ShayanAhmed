# Build brief — Hero section "O·3" (The Build cover + Built-in index)

> Paste this whole file into Claude Code, with `hero-reference.html` placed in the repo (e.g. `/design/hero-reference.html`).
> `hero-reference.html` is the **visual source of truth**. Open it in a browser; match it.

---

## 1. Task

Replace the current hero section of my portfolio with the design in `design/hero-reference.html`.

- **Keep my existing navbar component exactly as it is.** The navbar inside the reference file is only there for context. Do not rebuild or restyle it.
- Build only the hero: everything from the "NO. 01 — NOVEMBER 2026" line down to the end of the "What's built in" panel.
- Remove the old hero completely, including the Brands Attire device mockup on the right.
- Don't touch any other section.

## 2. Stack and conventions

- Next.js (App Router) + TypeScript + Tailwind CSS. Use the conventions already in the repo.
- Animation: **Motion** (`motion/react`), which is already used in this project. No GSAP in the hero.
- Fonts: `next/font/google`, self-hosted. No `<link>` to Google Fonts.
- No new dependencies beyond the above.

## 3. Files to create

```
components/hero/Hero.tsx            // section wrapper: background, layout
components/hero/BuiltInIndex.tsx    // client component: the cycling panel
components/hero/hero-data.ts        // ITEMS array (title + desc) and copy
```
Use the existing folder structure if it differs. Only `BuiltInIndex.tsx` needs `"use client"`. `Hero.tsx` stays a server component.

## 4. Fonts

```ts
import { Archivo, Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display" }); // needs the width axis for the condensed masthead
const serif   = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });
const inter   = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono    = JetBrains_Mono({ subsets: ["latin"], weight: "500", variable: "--font-mono" });
```
If the site already loads Inter or a mono font, reuse those and only add Archivo (with the `wdth` axis) and Instrument Serif.

## 5. Design tokens

Add these to the Tailwind theme (or as CSS variables), then use them by name:

| Token | Value | Use |
|---|---|---|
| ink | `#120C08` | hero background |
| paper | `#F3EADB` | primary text |
| muted | `#CFC3B2` | paragraph text |
| muted-2 | `#B5A893` | issue line |
| muted-3 | `#8F8170` | counter |
| copper | `#E8B27A` | accents, rules, eyebrow |
| copper-hi / mid / lo | `#F2CC9C` / `#D49A62` / `#B8763F` | primary button gradient |
| brown | `#6B3F22` | button bottom edge |
| on-copper | `#140D08` | text on the copper button |

**Copper foil** (masthead, "built in.", the big numeral). Make this a reusable utility class:
```css
.foil{background:linear-gradient(100deg,#8C5530 0%,#E8B27A 20%,#F7DCB5 30%,#C08048 46%,#7A4626 60%,#D9A06A 78%,#F2CC9C 88%,#9A5E33 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
```
The foil is **static**. No shimmer animation.

## 6. Layout (desktop 1440 × 1040 target)

Section: `relative overflow-hidden min-h-screen bg-ink`. Inner container: `max-w-[1360px] mx-auto px-8 pb-11`, flex column, `min-h-screen`.

Background, two absolutely positioned decorative layers (`aria-hidden`, `pointer-events-none`). Copy them exactly from the reference:
1. **Static copper glow.** Two radial gradients (top-right and bottom-left). **Never cursor-following.**
2. **Cutting-mat grid.** 24px fine lines plus 120px major lines in copper at low opacity, masked to fade out toward the edges.

Content, top to bottom:
1. **Issue line.** Mono 11px, tracking .14em, `muted-2`, three items spread with `justify-between`, a 1px copper/30% bottom border, `mt-7`.
2. **Masthead "THE BUILD".** Archivo 900 at width axis 62 (`font-stretch:62%` **and** `font-variation-settings:'wdth' 62`), uppercase, `white-space:nowrap`, centred, `font-size:clamp(88px,23.5vw,340px)`, `line-height:.8`, `letter-spacing:-.03em`, with `.foil`. It's decorative (`aria-hidden`), because the h1 carries the meaning. On a 1440 screen it must span almost the full container width on **one line**.
3. **Credit line.** Mono 11px, copper: "SHAYAN AHMED — FULL-STACK DEVELOPER" on the left, "STOREFRONTS · BACK OFFICES · AGENTS" on the right.
4. **Lower row.** Flex, wraps, `gap-12`, `items-end`, `pt-11`, `flex-1` so it sits at the bottom.
   - **Left (story)**, `flex: 999 1 600px`:
     - Eyebrow: 28px copper rule + "COVER STORY" (mono, copper, tracking .16em).
     - `<h1>`: Instrument Serif 400, `clamp(52px,6.8vw,104px)`, leading .95, tracking -.02em. Text: **Websites with the systems** *built in.* where *built in.* is `<em>` with `.foil`. It must be 2 lines at 1440.
     - Lede: 17px Inter, leading 1.65, `muted`, max-width 560px. "Shayan Ahmed" is `<strong>` in paper/600.
     - Buttons: **Start a project →** (copper gradient, 4px radius, 54px tall, inset highlight, `0 4px 0 #6B3F22` bottom edge, soft copper shadow) and **See a case study** (ghost, 1px paper/40% inset ring). Both are `<a>` links.
   - **Right (Built-in index)**, `flex: 1 1 340px; max-width: 420px`, top border 1.5px copper. See section 7.

## 7. Built-in index (the only animated part)

Data (`hero-data.ts`):
```ts
export const BUILT_IN = [
  { title: "Order checks",  desc: "Risky orders are flagged before they ship." },
  { title: "Admin panel",   desc: "Orders, stock and customers in one place." },
  { title: "Lead tracking", desc: "Every enquiry captured and followed up." },
  { title: "Email panel",   desc: "Welcomes, follow-ups and replies from one inbox." },
  { title: "Daily brief",   desc: "Your morning summary, ready before you are." },
  { title: "Smart agents",  desc: "Routine work prepared — you approve every step." },
];
```

Structure:
- Header row: "WHAT'S BUILT IN" (copper mono) on the left and a counter "01 / 06" (muted-3) on the right.
- Body (`min-h-[150px]`, `aria-live="polite"`): a big numeral "01" (Instrument Serif 112px, leading .82, `.foil`). Next to it, the title (Instrument Serif *italic* 34px, paper) and the description (Inter 15px, muted).
- Progress: 6 equal segments in a grid with a 6px gap. Each is a `<button aria-label={title} aria-pressed>` that is 28px tall and holds a 2px bar:
  - active: `#E8B27A`
  - already passed: copper/45%
  - upcoming: paper/16%

Behaviour:
- Auto-advance every **3600ms**, looping.
- Clicking a segment jumps to that item **and restarts the timer**.
- On each change, the numeral, title and description roll in. Each sits inside an `overflow:hidden` mask, and the inner element animates from `{ y: "100%", opacity: 0, filter: "blur(8px)" }` to `{ y: 0, opacity: 1, filter: "blur(0px)" }` over `0.9s` with ease `[0.16, 0.84, 0.24, 1]`. Use `key={index}` (or `AnimatePresence mode="popLayout"`) so it replays on every change. Add a little bottom padding inside the mask (≈ .14em) so italic descenders aren't clipped.
- `useReducedMotion()`: if true, no roll animation and **no auto-advance**. Users can still click the segments.
- Pause auto-advance while the tab is hidden (`document.visibilityState`).
- Clean up the interval on unmount.
- The panel height must stay identical for all 6 items, so nothing below shifts.

## 8. Responsive

- ≥1100px: as described.
- <1100px: the lower row wraps, and the index panel drops below the story at full width (max 420px).
- 390px phone: the masthead stays on one line (the clamp handles it). The h1 wraps naturally. No horizontal scroll anywhere. Buttons wrap.

## 9. Do NOT add

- Flip / split-flap letters, rotating seals or stamps, a cursor-following glow, a shimmer on the foil, or the old device mockup.
- Any extra text, stats or badges that aren't in the reference.

## 10. Acceptance checklist (verify each before finishing)

- [ ] At 1440×1040 the hero matches `hero-reference.html` side by side: same spacing, sizes and colours.
- [ ] "THE BUILD" is on one line and nearly full width at 1440, and still one line at 390.
- [ ] The h1 is 2 lines at 1440.
- [ ] The index cycles every 3.6s, clicks jump and restart the timer, and the panel height never changes.
- [ ] Reduced motion: no animation and no auto-advance.
- [ ] No horizontal overflow at 390, 768, 1024 and 1440.
- [ ] The existing navbar is unchanged.
- [ ] Lighthouse: no layout shift (CLS ≈ 0) from fonts or the index. Use `next/font` and keep the fixed-height panel.
- [ ] `npm run build` passes with no type errors.
