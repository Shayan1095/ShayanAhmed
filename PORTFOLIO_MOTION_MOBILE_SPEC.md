# Portfolio upgrade: motion system + mobile-native layout

You are working on my portfolio site (Next.js App Router, TypeScript, Tailwind, shadcn/ui). Animation libraries already installed: Motion (Framer Motion), GSAP + ScrollTrigger, Lenis, React Bits. Live at https://shayan-ahmed-steel.vercel.app.

## How to work

1. **Read the codebase first.** Map the existing section components (ids: `hero`, `work`, `services`, `archive`, `process`, `about`, `faq`, `contact`, plus header, marquees, footer, preloader, mobile menu). Tell me what you found and where each change will go before editing.
2. **Work in the phases below, in order.** Stop after each phase, summarise what changed, and wait for me to check it on a real phone before continuing.
3. **Do not change:** brand colours, fonts (Archivo, Geist, Martian Mono), copy, the SA keycap logo, the crop-mark preloader concept, or the desktop navbar layout.
4. **Do not invent content.** No fake testimonials, metrics, client names or screenshots. Where media is missing, build the component to accept it via props/data and render a clean, intentional fallback (not an empty frame). List every asset I need to supply at the end of each phase.
5. "Mobile" means `max-width: 767px`. Desktop behaviour stays as it is unless a phase says otherwise.

---

## Phase 0 — Fixes before any motion

- Rolling/duplicated text (section labels, spec sheet values print 3×): mark the visual duplicate copies `aria-hidden="true"` so screen readers read each value once.
- All `input`, `select`, `textarea`: `font-size: 16px` minimum (stops iOS zoom on focus). Add correct `inputmode` and `autocomplete` (email field gets `type="email" inputmode="email" autocomplete="email"`).
- Every tap target at least 44×44px (header logo link and some form controls are currently smaller).
- `-webkit-tap-highlight-color: transparent` globally.
- Hero uses `min-height: 100svh`, not `100vh`.
- `scroll-margin-top` on every section equal to the header height, so anchor links don't land under it.
- Spec sheet "Stack" value must wrap on narrow screens instead of clipping.
- Section numbering: there is no 06 yet (testimonials come later). Renumber so there's no visible gap, and leave a commented slot for a future Testimonials section.
- Footer "screen" card that renders nearly empty: remove it on mobile; on desktop, either fill it with a small terminal-style log or remove it — ask me which.

## Phase 1 — Surfaces (light/dark rhythm)

Every section is currently near-black, so the page reads as one long dark scroll.

- Tokens: `--ink: #111111`, `--paper: #F3EADB`, keep the existing copper accent.
- Section surfaces: **ink** for hero, proof (new, Phase 4), services, contact; **paper** for work/archive, process, about/FAQ. Create text, muted-text, border and card tokens per surface (e.g. a `.surface-ink` / `.surface-paper` class that redefines them), so components work on both without per-component overrides.
- Paper sections get a very subtle paper texture (CSS noise or a tiny tiled image, < 10KB).
- Update `<meta name="theme-color">` as each section becomes the dominant one in the viewport (IntersectionObserver), so the mobile browser bar changes with the page.

## Phase 2 — Motion system (foundation)

### Tokens (CSS variables, mobile overrides under 768px)

| Token | Desktop | Mobile |
|---|---|---|
| `--dur-micro` | 150ms | 120ms |
| `--dur-ui` | 260ms | 220ms |
| `--dur-reveal` | 700ms | 550ms |
| `--dur-hero` | 1100ms | 900ms |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | same |
| `--ease-inout` | `cubic-bezier(0.65, 0, 0.35, 1)` | same |
| `--travel` | 32px | 18px |
| `--stagger` | 60ms (max 6 items) | 40ms (max 4 items) |

Mirror these as a TS constants file for Motion/GSAP.

### Rules (enforce everywhere)

- Animate only `transform`, `opacity`, `clip-path`. Never width/height/top/margin.
- Content must be visible if JS fails: the hidden "before" state is applied by a class JS adds, never by plain CSS.
- No element stays hidden more than ~600ms.
- Reveal once; don't replay on scroll-up.
- The hero `h1` must **not** start at `opacity: 0` (hurts LCP). Reveal it with a clip-path/translate mask from a painted state.
- Hover effects only inside `@media (hover: hover)`. Touch gets press states.
- One signature move per section.

### Library roles

- **CSS scroll-driven animations** (`animation-timeline: view()`) for simple reveals and progress fills, wrapped in `@supports (animation-timeline: view())` with an IntersectionObserver fallback.
- **Motion** for component state: menu, sheets, accordions, toggles (`layoutId`), presses. Wrap the app in `<MotionConfig reducedMotion="user">`.
- **GSAP + ScrollTrigger** only for the desktop set pieces in Phase 5. Register everything through one `gsap.matchMedia()` with separate desktop / mobile / reduced-motion branches. No pinning on mobile.
- **Lenis** only on non-touch devices (`(hover: hover) and (pointer: fine)`); keep `syncTouch` off.
- **React Bits**: at most one or two text effects, never on the critical path.
- **3D hero (R3F), if/when built**: desktop only, lazy-loaded after idle. Mobile gets a pre-rendered still or short muted video of the same scene.

### Shared primitives to build

- `<Reveal>`: fade + translateY(`--travel`), optional stagger for children.
- `<SectionHeading>`: section label rolls in like a slot (reuse the existing rolling label), heading reveals line by line from a mask, then body fades up. **Use this same entrance in every section except the hero and the three set pieces** — consistency is the point.
- `<Pressable>` (or a utility class): scale 0.97 on press, 120ms, spring back. Keycap-style buttons also drop 1px and shrink their shadow. Apply to every button, card and link-card.

### Reduced motion

Under `prefers-reduced-motion: reduce`: stop marquees, disable all scrubbed/pinned timelines, replace movement with short crossfades (content still appears), keep press states minimal.

## Phase 3 — Mobile structure

Goal: home page under **8,000px** tall at 375px wide (currently ~12,900px). Check with `document.documentElement.scrollHeight`.

### New mobile order

1. Hero (ink)
2. Proof — new (ink)
3. Selected work + Archive, merged (paper)
4. How it works / Services (ink)
5. Process (paper)
6. About + FAQ, merged (paper)
7. Contact + footer (ink)

Desktop keeps its current order.

### Remove on mobile

- Both marquees.
- The repeated CTA cards ("Want a system like this…", "Ready to map out your build?").
- Service layer bullet lists (move into accordion content).
- Footer screen card.

### Bottom navigation pill (mobile only)

Replace the fixed top header **and** the fixed bottom "Reply within a day / Start a project" bar with one floating pill:

- Left: menu button. Centre: SA mark + the existing live section label. Right: copper "Start" button → `#contact`.
- Position: `bottom: calc(12px + env(safe-area-inset-bottom))`, side margins 12px, blurred ink background, 56px tall.
- Hides on scroll down, returns on scroll up or after 600ms idle (Motion).
- Hidden while the hero or contact section is in view.
- Add bottom padding to the page so the pill never covers content.
- Desktop navbar unchanged.

### Menu → bottom sheet (mobile)

- Full-height sheet sliding up (Motion), links stagger in at 40ms.
- "Latest project" with a real thumbnail (from data), email and WhatsApp buttons (I'll provide the number), local Pakistan time (already computed).
- Swipe down or tap the backdrop to close; `overscroll-behavior: contain`; focus trapped while open; Escape closes.

### Patterns

- **Snap rows**: `scroll-snap-type: x mandatory`, cards 88vw with the next card peeking, dot indicator under the row, native scrolling only.
- **Bottom sheets** for project details (reuse the menu sheet component).
- **Accordions**: single-open, smooth height (Motion or CSS `interpolate-size: allow-keywords` with fallback), `+` rotates to `×`.
- **Chips** instead of the project-type `<select>` in the contact form on mobile.
- Typography floor: body 16px, mono labels at least 12px with added letter-spacing.

## Phase 4 — Section-by-section build

### Header (desktop)
Navbar layout stays exactly as it is. Add behaviour only: it hides on scroll down and returns on scroll up (Motion, `--dur-ui`); a 1px copper progress line under it shows page scroll progress (CSS `animation-timeline: scroll()` with fallback); the live section label keeps its slot-roll change.

### Marquees (desktop)
Speed and direction follow scroll velocity (read velocity from Lenis): scrolling down speeds them up, scrolling up briefly reverses them, then they ease back to base speed. Stopped under reduced motion. (Removed on mobile, see Phase 3.)

### Preloader
Keep the crop-mark concept. Cap at 1.6s desktop / 1.0s mobile. Show once per session (sessionStorage), never on internal navigation. **The preloader's final split line becomes the hero's top rule**, so the handoff reads as one motion.

### Hero
"THE BUILD" letters rise from a clip mask (40ms stagger), headline reveals line by line, one copper sweep across "built in", CTAs fade up last. Make "Shayan Ahmed" clearly visible in the first screen at real weight. Desktop: background glow follows the cursor slightly. Mobile: no cursor effect; glow drifts slowly on a CSS loop. The "What's built in" index: number changes like an odometer, a thin bar fills per item; on mobile it is also swipeable with dots.

### Proof (new, directly after hero)
A phone frame playing a muted, looping, `playsinline` MP4 of the Brands Attire owner panel, with a poster image, lazy-loaded. Under it, three agent alerts (data-driven, e.g. "Order risk guard — Order #1042 flagged: duplicate address") appear one by one, 400ms apart, when the section enters view. Tapping opens `/work/brands-attire`. Until I supply the video, render the poster/fallback card cleanly.

### Selected work + Archive
- Mobile: case studies as a snap row (screenshot, name, one-line outcome); remaining builds as compact index rows — type, code (SA–03), name, thumbnail on the right — tapping opens a bottom sheet.
- Desktop: as each case enters, the floating agent notifications fly in around the screenshot one by one. Archive rows show a screenshot preview that follows the cursor on hover.
- Customer/Owner toggle: sliding pill with `layoutId`, screenshot crossfade.
- The "02 shipped" counter: show total builds instead, or remove it.

### Services — signature #1: the order ticket
Replace the static 4-step flow with an order ticket that travels through the system:
1. An "Order #1042" ticket card drops in.
2. It reaches **Risk check**: a scan line passes over it and a copper stamp lands: "FLAGGED — duplicate address".
3. It reaches **You approve**: an Approve control pulses and waits.
4. On approve: "DISPATCHED" stamp, ticket slides off; "Courier booked, customer notified".

- Desktop: pinned with ScrollTrigger; steps 1–3 driven by scroll; step 3 waits for a click and auto-completes after 2s if the user keeps scrolling.
- Mobile: no pin. The ticket moves down a vertical rail as the user scrolls (CSS scroll-driven fill). The approve step is a **swipe-to-approve slider** the visitor actually drags; if they scroll past, it completes itself.
- Reduced motion: show the four states as a static sequence.
- Below it, the three layers (Website / System / Automation): desktop = three plates that separate slightly in 3D on scroll; mobile = single-open accordion chips.

### Process — signature #2: the ruler
Not a zig-zag and not a curved line between tilted cards (that's the SKY Tech design — must not look like it).
- A vertical ruler with tick marks (same visual language as the preloader's ruler line).
- On scroll, copper ink fills the ruler downward.
- Each step card starts as a **blueprint**: dashed border, faint (but readable) text, crop marks at the corners. When the copper reaches it, it **inks in**: solid border, full-contrast text, the number stamps in, the "You get" line types out in mono.
- Desktop: ruler centred, cards alternate sides, cards stack as they pass.
- Mobile: ruler on the left edge, full-width cards on the right, CSS `position: sticky` stacking with increasing `top` offsets. Fill via CSS scroll-driven animation. No pinning, no per-scroll JS. Lines at least 1.5px; tick marks every 40px.

### About + FAQ
Photo reveals with a clip-path wipe (photo from data; tasteful fallback until I add it). Spec sheet rows type in, 60ms apart. FAQ: accordion, first question open, data-driven so I can add 5–7 questions.

### Contact
Inputs get a copper underline that draws on focus. Project type as chips on mobile. Send button: idle → loading → a terminal-style "› Transmitted" line. Submit stays reachable with the keyboard open. Add WhatsApp and email buttons beside the form.

### Footer
Desktop: curtain reveal (page lifts away to reveal the fixed footer) and "SHAYAN AHMED" rises letter by letter. Mobile: no curtain; simple letter rise.

### Page transitions — signature #3: card → case study
Use the View Transitions API (check what my Next.js version supports): the case card image gets the same `view-transition-name` as the hero image on `/work/[slug]`, so it grows into place. Fallback: 250ms slide-in. Case pages on mobile: hero image (morphed), big title, two-column meta row (type + year | role + stack), one paragraph problem statement, full-bleed screens with one-line captions, "What it changed" (2–3 outcomes from data), and a "Next case" card that morphs into the next page.

## Phase 5 — Performance and verification

Budgets (mobile, 4G):
- LCP < 2.5s, INP < 200ms, CLS < 0.1 (currently 0 — keep it; set width/height on all media).
- Initial JS < ~200KB compressed. GSAP and anything heavy load only where used; three.js never on mobile.
- 60fps with 4× CPU throttling in DevTools.

Before you call this done, report:
- Home page height at 375px (target < 8,000px).
- Lighthouse mobile scores on the deployed Vercel preview.
- Confirmation that reduced motion, keyboard-only navigation and VoiceOver (no triple-read labels) all work.
- Confirmation that content is visible with JS disabled.
- The full list of assets I still need to supply (screenshots, owner-panel video + poster, photo, WhatsApp number, FAQ answers).
