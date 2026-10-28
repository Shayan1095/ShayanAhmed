# Shayan Ahmed Portfolio: Design and Build Spec

This file is the source of truth for the portfolio's design system, page structure and motion. Read it fully before writing UI code. When something here conflicts with a default habit, this file wins. When something is missing, ask before inventing.

---

## 1. Project summary

- **Owner:** Shayan Ahmed, full-stack developer (Next.js / MERN), based in Pakistan, working with local and international clients.
- **Positioning line:** "Websites with the systems built in." He builds the website customers see, the system the team runs on, and the automations inside it.
- **Primary goal:** win international clients. Primary CTA is the contact form.
- **Concept:** the whole site is one physical device, opened up. The hero shows the device, the camera dives inside it, and every section after uses the same materials, lights and labels.
- **Design language:** modern skeuomorphism (hardware, not leather): raised cream panels, inset tracks, ink screens, status lights, printed labels.

## 2. Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) | Public pages statically generated, revalidated on admin save |
| Language | TypeScript, strict | Shared types between admin and public site |
| Styling | Tailwind CSS v4 | Tokens in `@theme`, section 4 |
| UI primitives | shadcn/ui | Mainly admin panel; public site restyles only Form, Accordion, Dialog |
| Scroll and timelines | GSAP + ScrollTrigger + SplitText | Owns everything tied to scroll or a timeline |
| Component state motion | Motion (`motion/react`) | Owns hover, press, toggles, layout reflow. Never touches GSAP-owned elements |
| Smooth scroll | Lenis | Driven by GSAP ticker |
| 3D | React Three Fiber + Drei | Hero and footer only, one shared scene |
| Effects | React Bits, max 3 | Magnet (buttons), Tilted Card (archive cartridges), Variable Proximity (footer wordmark) |
| Page transitions | View Transitions API | Project card to case study hero |
| Icons | Lucide React | Admin plus a few on public pages |
| Data | MongoDB Atlas + Mongoose | Section 11 |
| Auth | Auth.js, single admin, credentials | Password hash in env |
| Images | Cloudinary | |
| Email | Resend | Contact form notifications |
| Hosting | Vercel | |

**Do not add:** GSAP Flip, Rive, Theatre.js, OGL, any other animation or 3D library, any UI kit besides shadcn.

## 3. Hard rules

1. **One owner per element.** GSAP animates scroll and timelines. Motion animates component state. No element is animated by both.
2. **No fake content.** No invented testimonials, stats, client names, ratings or results. Missing content renders as nothing (section hidden), never as a placeholder on the live site.
3. **Content must be readable without JS or WebGL.** Every heading, label and console message exists as real HTML. 3D is decoration with an HTML fallback.
4. **Reduced motion is a designed state.** With `prefers-reduced-motion: reduce`: no Lenis, no pinning, no scrubbed scenes; content appears in place; switches and toggles still work.
5. **Performance budget:** public page JS under ~200KB gzipped before the 3D chunk; LCP under 2.5s on a mid-range Android; 3D loads after the page is interactive.
6. **One signature motion per section.** Everything else uses the shared reveal.
7. **Accent discipline:** one lit status light per view.

## 4. Design tokens

### Color

Two required brand colors plus one brown family split into two values: **Walnut** for accents on cream, **Copper** for lights and accents on ink.

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `paper` | `#F3EADB` | Primary. Page ground, cream panels | — |
| `paper-hi` | `#FBF6EC` | Lit edge, raised panel top | — |
| `paper-lo` | `#E4D8C3` | Shaded face, inset tracks, fields | — |
| `paper-edge` | `#CDBFA6` | Hard edges, bevels, hairlines on cream | — |
| `ink` | `#111111` | Secondary. Text, screens, dark bands | 15.9:1 on paper |
| `ink-2` | `#1E1C1A` | Raised surface on ink | — |
| `ink-3` | `#2C2925` | Bevels and hairlines on ink | — |
| `muted` | `#675E52` | Secondary text on cream | 5.3:1 |
| `muted-ink` | `#A89D8B` | Secondary text on ink | 7.1:1 |
| `walnut` | `#6B4A2F` | Accent on cream: italic emphasis, active labels, links | 6.7:1 on paper |
| `copper` | `#C9853F` | Status lights, progress, accents on ink | 6.2:1 on ink |
| `danger` | `#B23A12` | Form errors only | — |

Never put `copper` text on `paper` (2.6:1, fails). Never put `walnut` text on `ink` (2.4:1, fails).

Status light glow: `box-shadow: 0 0 10px 1px rgb(201 133 63 / .7)`.

### Type

Load with `next/font/google`.

| Role | Family | Settings |
|---|---|---|
| Display | **Anybody** (variable `wdth` 50–150, `wght` 100–900) | Headlines 800, `wdth` 115–125, tracking -0.035em, leading 0.86–0.95, uppercase for hero and section titles |
| Display italic | Anybody italic | Emphasis words, `wdth` 95, colored `walnut` on cream |
| Body | **Hanken Grotesk** 400/500/600 | 16–19px, leading 1.6, measure ≤ 65ch |
| Labels | **Martian Mono** 400/500 | 11–12px, uppercase, tracking 0.14em. Hardware-label voice |

Type scale (desktop / mobile): hero `clamp(56px, 10.4vw, 160px)`; section title `clamp(36px, 5vw, 72px)`; card title 24–32px; body 17px; label 11.5px.

### Tailwind v4 theme (`app/globals.css`)

```css
@import "tailwindcss";

@theme {
  --color-paper: #F3EADB;
  --color-paper-hi: #FBF6EC;
  --color-paper-lo: #E4D8C3;
  --color-paper-edge: #CDBFA6;
  --color-ink: #111111;
  --color-ink-2: #1E1C1A;
  --color-ink-3: #2C2925;
  --color-muted: #675E52;
  --color-muted-ink: #A89D8B;
  --color-walnut: #6B4A2F;
  --color-copper: #C9853F;
  --color-danger: #B23A12;

  --font-display: var(--font-anybody), "Arial Narrow", system-ui, sans-serif;
  --font-sans: var(--font-hanken), system-ui, sans-serif;
  --font-mono: var(--font-martian), ui-monospace, monospace;

  --radius-panel: 22px;
  --radius-card: 16px;
  --radius-control: 12px;

  --shadow-raised: inset 0 1px 0 rgb(255 255 255 / .85), inset 0 -1px 0 rgb(17 17 17 / .06), 0 1px 1px rgb(17 17 17 / .08), 0 10px 20px -8px rgb(17 17 17 / .22), 0 30px 60px -28px rgb(17 17 17 / .30);
  --shadow-raised-sm: inset 0 1px 0 rgb(255 255 255 / .9), 0 1px 1px rgb(17 17 17 / .10), 0 4px 10px -4px rgb(17 17 17 / .25);
  --shadow-inset: inset 0 2px 5px rgb(17 17 17 / .16), inset 0 1px 1px rgb(17 17 17 / .12), inset 0 -1px 0 rgb(255 255 255 / .75);
  --shadow-keycap: inset 0 1px 0 #fff, inset 0 -6px 0 var(--color-paper-lo), 0 6px 0 var(--color-paper-edge), 0 10px 16px -6px rgb(17 17 17 / .35);
  --shadow-screen: inset 0 0 30px rgb(0 0 0 / .7);
  --shadow-ink-raised: inset 0 1px 0 rgb(255 255 255 / .08), 0 30px 60px -30px rgb(0 0 0 / .9);

  --ease-out-expo: cubic-bezier(.16, 1, .3, 1);
}

body { background: var(--color-paper); color: var(--color-ink); }
```

Add a fixed full-page grain overlay (SVG `feTurbulence`, ~7% alpha, `mix-blend-mode: multiply`, `pointer-events: none`). It is what makes flat cream read as a material.

### Spacing and layout

- Container max width 1240px; side gutter `max(16px, env(safe-area-inset-left))` on mobile, 56px from 900px up.
- Section vertical padding: 120px desktop, 80px mobile.
- Grids: 3 columns desktop, 2 tablet, 1 below 640px. Always `minmax(0, 1fr)`.

## 5. Materials and components

Three materials, used everywhere. Do not invent a fourth.

1. **Raised panel** (`bg-gradient from-paper-hi to-paper`, `shadow-raised`, `rounded-panel`): any content card. Optional corner screws on hero-level objects only.
2. **Inset track** (`bg-paper-lo shadow-inset rounded-control`): nav link track, filters, form fields, toggles.
3. **Ink screen** (`bg-ink` with radial highlight, `shadow-screen`, scanline overlay, diagonal gloss): consoles, UI fragments, monitors. Text inside is cream with soft glow; tags in `copper`.

Core components to build once and reuse:

| Component | Description |
|---|---|
| `Button` | `ink` (dark, presses down 2px on active) and `paper` (raised). Min height 48px. Wrap in React Bits Magnet on desktop |
| `StatusLight` | Copper dot with glow and slow pulse. Props: `on`, `label` |
| `Label` | Martian Mono uppercase hardware label |
| `Panel` | Raised panel, optional screws |
| `Screen` | Ink screen with boot animation on enter (section 6) |
| `UiFragment` | Small code-built UI card shown on an ink screen or floating near a project (risk flag, approval request, email, lead) |
| `InsetToggle` | Segmented control in an inset track, raised active key slides with Motion `layoutId` |
| `Switch` | Physical toggle switch, lever slides with spring |
| `Cartridge` | Archive project card: grip strip on top, label area, status badge |
| `Drawer` | FAQ row with recessed handle |
| `SectionHeader` | Label + split-reveal title + one-line intro |

Status badges: `Client` (ink fill, cream text), `Product` (inset, ink text), `Confidential` (outline, muted text).

## 6. Motion grammar

Shared across the site so nothing feels bolted on.

- **Easing:** `expo.out` (GSAP) / `--ease-out-expo` (CSS) for entrances; `power2.inOut` for toggles; springs (stiffness 400, damping 30) for Motion presses.
- **Headings:** SplitText by lines, masked, `yPercent: 110 → 0`, 1.0s, stagger 0.08, triggered at `top 85%`, once.
- **Content blocks:** `y: 40 → 0`, 0.9s, once. Transform only, elements are visible at rest (no `opacity: 0` waiting on a trigger).
- **Screen boot (the site-wide motif):** every `Screen` entering view flickers like a monitor waking: brightness 0 → .6 → .06 → .85 → .25 → 1 over ~0.5s, then content types in. Use it on every ink screen, nowhere else.
- **Scrubbed scenes:** `scrub: 0.8`, never linear-feeling; pinned length max 1.6 viewport heights.
- **Hover:** cards lift 4–6px; keycaps press down 4px; buttons magnetic.

### Lenis + GSAP setup

```ts
// app/providers/smooth-scroll.tsx ("use client")
const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
// Skip all of this when prefers-reduced-motion is set.
```

Use `@gsap/react` `useGSAP` with scoped refs and `gsap.matchMedia()` for desktop-only scenes. Clean up on unmount.

## 7. Navbar

- Left: `SA` monogram (keycap style) + "Shayan Ahmed".
- Center: links **Work · Services · About** inside an inset track. A raised key slides under the active section (scroll spy + Motion `layoutId`).
- Right: `StatusLight` + availability text from admin (e.g. "Booking for December"), then **Start a project** button. On hover the button reveals "Reply within 24h".
- Clock line (desktop, under or beside status): `Pakistan · PKT 16:32 (GMT+5)`, live, client-side only.
- Behavior: hides on scroll down, returns on scroll up; compacts after the hero; 2px copper scroll-progress line along its bottom edge.
- Sticky with `top: env(safe-area-inset-top)`.
- Mobile: full-screen control-panel menu with large links, clock, availability light and CTA.

## 8. Homepage sections

Bands alternate to mark chapters: **cream → ink → cream → cream → ink → cream → cream → cream → ink → cream**.

### Hero (cream) — Layout 2, "magazine cover"

**Composition:** giant uppercase headline across the full width ("WEBSITES WITH / THE SYSTEMS / *BUILT IN*.") behind the 3D **display slab** (the hero object) placed right, overlapping only the ends of lines 1–2. Bottom row: short intro + two buttons (left), spec bar (Stack · Clients in Pakistan and abroad · Scroll to take it apart), portrait chip with availability (right).

**Live caption:** beside the device, real HTML text that mirrors the device screen: `● Just now: Order #1042 flagged, owner notified`. Updates with each new screen line. `aria-live="polite"`.

**Slab screen:** top part shows the storefront (Website); a dark live strip along the bottom shows the latest event in large mono type, readable at rest, with SITE / ORDERS / LEADS channel tabs that are clickable.

**Entrance (≈1.4s):**
| Time | Event |
|---|---|
| 0.0s | Headline already rendered in HTML (LCP). Pre-rendered still image of the device, powered off |
| 0.15s | Headline lines rise from masks (SplitText) |
| 0.3s | 3D scene cross-fades over the still; device settles with weighted ease |
| 0.5s | Status light blinks twice |
| 0.8s | Screen boots (shared boot animation), live strip starts typing |
| 0.9s | Intro, buttons, spec bar rise in |

**Scroll (hero pinned ~1.6 viewport heights):**
| Progress | Event |
|---|---|
| 0–30% | Headline lines split and slide off left/right. Camera eases back, device rotates to three-quarter view and moves to center |
| 30–70% | Device separates into three layers along its depth axis, each with a label card: **Layer 1 · Glass = Website**, **Layer 2 · Board = System**, **Layer 3 · Core = Automation** (core chip glows copper, 8 agent ports labelled BRIEF, RISK, STOCK, RETURNS, DRAFTS, CATALOG, MERCH, FEEDBACK). Caption: "Every build ships with all three layers, designed together." |
| 70–100% | Layers rejoin, slab turns face-on, camera pushes into the dark live strip until it fills the viewport, becoming the Services band |

Add a "Skip the story" button that scrolls straight to Services.

**Hero object: display slab (build from Drei primitives, no external model).** Treat it as one swappable component, `<HeroObject />`, exposing three layer groups (glass / board / core), the screen mesh and the dive target. If it's replaced later, the scroll choreography stays the same.
- Frame: thin rounded rectangle 3.6 × 2.3 units, corner radius 0.16, depth 0.06 with 0.025 bevel. Material: `meshPhysicalMaterial` color `#F3EADB`, roughness 0.32, metalness 0.25, clearcoat 0.6 (reads as cream anodised metal, not plastic).
- Layer 1, Glass = Website: screen 3.38 × 2.08, radius 0.1, flush in the frame, a faint clearcoat glass sheet on top. Upper ~73% shows the storefront (real Brands Attire screenshot in production); the bottom 0.56 units is the dark live strip (copper top hairline, channel tabs, latest event). One small copper status light on the frame's top-right edge. No knobs, grilles or switches: anything that makes it read as a radio or gadget is out.
- Layer 2, Board = System: dark plate 3.3 × 2.05 printed with the owner dashboard (KPIs, 14-day sales line in copper, "Needs you" approvals list), marked as example data until real.
- Layer 3, Core = Automation: back housing in `paper-lo`, central chip with copper emissive rim and a point light whose intensity follows the explode amount; 8 agent ports wired to it (BRIEF, RISK, STOCK, RETURNS, DRAFTS, CATALOG, MERCH, FEEDBACK).
- Assembled z offsets: glass 0, board -0.12, core -0.26. Teardown moves glass +1.3 and core -1.3 along the slab's depth axis.
- Footer: the same slab, small, screen reads "Session complete · Thanks for scrolling" and powers down as the page ends.
- Lighting: Drei `Environment` with soft light panels (no HDR download needed via `Lightformer`), `ContactShadows` under the device. Colors must match page tokens exactly.
- Pointer: slab turns slightly toward cursor with damped easing (desktop only).
- Performance: `dpr={[1, 1.75]}`, `frameloop="demand"` when idle, pause when off-screen, `PerformanceMonitor` to drop quality, lazy-load the canvas after hydration.
- Mobile (< 900px) and reduced motion: show the pre-rendered still with the HTML console overlay; replace the 3D teardown with a short stacked reveal of the three layer rows.

### 01 Services (ink) — lands from the dive

- First, the console resolves into a **live workflow** of large readable nodes: *Order placed → Risk check → You approve → Dispatched*. Nodes light up one by one as you scroll (scrub), a copper signal dot travels between them.
- Then the **three layer modules** rise in (raised `ink-2` panels): Website, System, Automation, each with a one-line promise and 3 concrete outputs.

### 02 Selected work (cream)

- Pinned horizontal rail with a counter label (`01 / 02 SHIPPED`).
- Each slide: a monitor (ink frame) with the real screenshot, plus **3 floating `UiFragment` cards** drifting at different parallax speeds:
  - Brands Attire: "Order #1042 flagged: duplicate address", "Restock 3 items? Approve / Skip", "Checkout reminder sent with code".
  - SKY Tech: "New lead captured", "Welcome email sent", "Follow-up scheduled".
- Spec panel beside the monitor: status badge, title, 2-sentence summary, feature list, "Read the case study".
- Brands Attire slide has an `InsetToggle` **Customer view / Owner view** that swaps storefront and agent-dashboard screenshots inside the monitor.
- Clicking opens the case study with a View Transition from the monitor screenshot to the case study hero.

### 03 Archive (cream)

- Filter `InsetToggle`: All · Systems · Web tools · Automations. Grid reflows with Motion layout animation.
- `Cartridge` cards (React Bits Tilted Card on desktop). On hover, the cartridge lifts and a mini label screen boots with one fact.
- Projects: Restaurant management system (Product), School management system (Product), ISP subscriber billing (Client), University merit calculator (Client), Email campaign automation (Product), Lead management system for a US sales team (Confidential, no company names, no screenshots, architecture diagram only).

### 04 Process (ink)

- Rack panel with a mixing-desk fader. Scroll scrubs the fader cap; each of 4 steps lights its status light when reached: Discovery call → Plan and milestones → Build with weekly demos → Launch and handover.
- Under each step, one line on what the client receives.

### 05 About (cream)

- Portrait in a raised frame, slightly rotated.
- **Spec sheet** panel: label/value rows that type in on enter. Only true values, from admin: Stack, Based in (Pakistan), Time zone (GMT+5), Languages (English, Urdu), Projects shipped, Experience ("AI team at a software company, built a lead management backend for a US sales team"; never name the company).
- Short story paragraph and "Work with me" button.

### 06 Testimonial (cream, inset)

- Renders only when at least one testimonial is published with consent. One: single large italic quote on a raised card with a rotated "Approved" stamp in walnut. Two or more: same card, horizontal swipe.
- Zero: section not rendered at all.

### 07 FAQ (cream)

- `Drawer` rows, first open by default, Motion height animation. Answers come from admin.

### 08 Contact (ink)

- Left: title "Let's build your system.", promise line, email and LinkedIn as selectable text with copy buttons.
- Right: control-panel form (raised `ink-2` panel, inset fields): Name, Email, Project type, Budget range, Message, hidden honeypot.
- Send control: a large physical key that presses down. After the server confirms, the panel's screen boots and prints "Message received · reply within 24h". On error, the screen prints the reason and how to fix it.
- Server action: zod validation, rate limit by IP, save to Mongo `Inquiry`, send Resend email to Shayan.

### Footer (cream)

- The same device returns small (shared R3F scene), screen powers down as the page end is reached.
- Huge wordmark "SHAYAN AHMED" (React Bits Variable Proximity using Anybody's width axis).
- Links, PKT clock, "Back to top".

## 9. Case study template (`/work/[slug]`)

1. Hero: monitor with main screenshot (View Transition target), title, status badge, role, stack, live link or "Demo on request".
2. Problem: 2–3 sentences.
3. **System diagram:** that project's three layers (Website / System / Automation) with its real features in each.
4. Feature or agent cards (`UiFragment` style, built in code).
5. Customer view / Owner view toggle (when both exist).
6. Results: rendered only when real figures exist.
7. Testimonial for this project: only if published.
8. Next project link.

Brands Attire is labelled **Product build** until it converts; then admin switches it to **Client** and adds results and testimonial.

## 10. Copy rules

- Plain, specific, active. Say what the system does ("flags risky orders"), not adjectives ("innovative", "seamless", "cutting-edge").
- No em-dash asides, no "not X but Y" framing.
- Buttons are verbs: "Start a project", "Read the case study", "Send message".
- Brands Attire in public copy may be called "a clothing e-commerce brand" where a name isn't needed.

## 11. Admin panel and data

Route group `/admin`, protected by Auth.js middleware. Built with shadcn components, same tokens, **flat** (no skeuomorphic shadows): it's a daily tool.

Models (Mongoose):

```ts
Project {
  slug: string; title: string;
  category: "website" | "system" | "automation" | "web-tool";
  status: "client" | "product" | "confidential";
  summary: string; problem?: string;
  layers: { website: string[]; system: string[]; automation: string[] };
  features: { title: string; text: string }[];
  stack: string[]; liveUrl?: string; demoNote?: string;
  cover: CloudinaryImage; gallery: CloudinaryImage[];
  customerView?: CloudinaryImage; ownerView?: CloudinaryImage;
  uiFragments: { tag: string; text: string }[];
  results?: { label: string; value: string }[];
  featured: boolean; order: number; published: boolean;
}
Testimonial { name; role; company; photo?; quote; projectId?; consent: boolean; published: boolean; order }
Faq { question; answer; order; published }
SiteSettings { availability: string; email; linkedin; specSheet: { label: string; value: string }[]; heroCaptionEvents: { tag; text }[] }
Inquiry { name; email; projectType; budget; message; createdAt; status: "new" | "read" | "replied" }
```

Rules:
- Testimonial cannot be published unless `consent` is true.
- Saving any public model calls `revalidateTag` for the affected pages.
- Admin screens: Projects (table, drag to reorder, featured toggle, draft/published), Testimonials, FAQ, Site settings, Inbox.

## 12. Accessibility

- Text contrast ≥ 4.5:1 (token table above already passes when used as specified).
- Real `button`, `a`, `label` + `input`. Visible focus ring: 2px copper outline, 3px offset.
- 3D canvas `aria-hidden`; all its information duplicated in HTML.
- Pinned sections have "Skip the story".
- Touch targets ≥ 44px.

## 13. Build order

1. Project setup, tokens, fonts, grain, base components (section 5).
2. Navbar and footer (without 3D).
3. Homepage sections 01–08 with static content and the motion grammar.
4. Data models, admin panel, contact server action; connect sections to data.
5. Case study template.
6. Hero 2D version (still image + HTML console + split headline). Ship-ready on its own.
7. Hero 3D display slab, entrance, teardown, dive. Then footer slab.
8. Performance and accessibility pass on a real mid-range Android phone. 3D does not ship until it runs smoothly there.

## 14. Content still needed from Shayan

- Screenshots: Brands Attire storefront and admin; SKY Tech site and email panel; other archive projects.
- One portrait photo.
- True numbers for the spec sheet.
- FAQ answers: timelines, payment methods, overlap hours.
- Email and LinkedIn URL.
- Brands Attire storefront feature list.
