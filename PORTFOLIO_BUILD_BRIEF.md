# Portfolio upgrade: build brief

Site: https://shayan-ahmed-steel.vercel.app (Next.js 16.4.3, App Router, TypeScript, Tailwind)
Owner: Shayan Ahmed
Purpose of this file: instructions for a coding agent (Claude Code). Keep it in the repo root and work through it one phase at a time.

---

## 1. Goal

The site already has strong art direction and a lot of scroll motion. It does not yet show the work. This upgrade does three things, in this order of importance:

1. Put real proof on screen: recordings, screenshots, testimonials, fuller case studies.
2. Make the transitions between states feel continuous: page to page, dark to light, idle to pressed.
3. Let visitors operate the product: the agent feed and the order flow become playable.

Adding more decorative scroll animation is out of scope. Do not add any.

## 2. Ground rules

1. **Inspect before editing.** Read `package.json`, the route tree, the project data source, the admin panel, and the existing animation setup (GSAP, Lenis, Motion). Do not assume file paths. Report what you found before Phase 1.
2. **Do not redesign.** Keep the palette (dark base, copper accent, cream `#F3EADB`, ink `#111111`), the fonts (Archivo, Geist, Martian Mono), the navbar exactly as it is, the preloader, and the hero layout.
3. **No invented content.** Never write testimonial text, client names, metrics, results, emails, phone numbers or profile links. If data is missing, the component renders nothing. No "coming soon" and no placeholder boxes.
4. **No new heavy dependencies.** Use what is installed. No Three.js or React Three Fiber, no new animation library. Ask before adding any package.
5. **Reduced motion.** Every new animation needs a `prefers-reduced-motion: reduce` fallback. Videos show their poster. Positional movement becomes a fade or nothing.
6. **Performance budget.** No layout shift from media (every media slot has a fixed `aspect-ratio`). Nothing new blocks first paint. Animate only `transform`, `opacity`, `clip-path` and `filter`. Pointer handlers are throttled with `requestAnimationFrame`.
7. **Never trap the scroll.** An interaction can be optional on top of a scroll sequence. It can never be required to continue down the page.
8. **Mobile is designed, not shrunk.** Each phase is checked at 375px. Hover-only effects are gated behind `(hover: hover) and (pointer: fine)`.
9. **One phase, one commit.** After each phase: run the type check, lint and build, list what changed, list what to check by hand, then stop and wait.
10. **Do not touch** the contact form's server action or its honeypot field (`website`).

## 3. Motion tokens

Create one shared source (CSS variables plus a small TS export for GSAP and Motion) and use it for all new work. Migrate existing values only when you touch that component.

| Token | Value | Use |
|---|---|---|
| `--dur-press` | 120ms | button press, toggles |
| `--dur-fast` | 200ms | hover, focus, small fades |
| `--dur-base` | 400ms | card state changes, morphs |
| `--dur-slow` | 800ms | section reveals, curtain |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | things arriving |
| `--ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | things leaving |
| `--ease-inout` | `cubic-bezier(0.65, 0, 0.35, 1)` | things moving between positions |

Exits are faster than entrances. Old content leaves in about 150ms, new content arrives in 200 to 400ms.

---

## 4. Phases

### Phase 0: repo survey (no code changes)

Report:
- Where project, case study, testimonial and FAQ data live, and how the admin panel writes them.
- Which animation libraries are installed and where Lenis and ScrollTrigger are initialised.
- Whether internal links use `next/link`. In a live test, clicking the hero's "See a case study" caused a full document reload. Find out why.
- Any existing `view-transition` CSS.
- A short plan per phase with the files you expect to touch.

### Phase 1: correctness and consistency

1. **Duplicate IDs.** `builder-title` is used three times and `services-title` twice. Make every ID unique and keep `aria-labelledby` pointing at the visible heading.
2. **One source for counts.** "08 builds shipped", "See all 6 builds" and "All 08 builds" disagree. Derive every count from the project data.
3. **Section numbering.** The home page shows "01 · Selected work" and "01 · Archive". Number sections in order from one list.
4. **Heading system.** All section `h2`s use the same wide all-caps display style. The hero `h1` keeps its own style as the single exception. The contact heading and the footer CTA heading currently use sentence case: bring them into the `h2` style.
5. **Overlapping cards.** In the case-study browser frames the floating notification cards cover the project title. Reposition them to the frame edges so the centre stays clear (the centre will hold real media after Phase 2).
6. **Dead space.** The pinned services stage leaves about half the viewport empty. There are long blank gaps after "See all builds" and after the FAQ. Tighten the stage height and section padding.
7. **Stale scroll positions.** Document height changed by about 1,800px during a session. Call `ScrollTrigger.refresh()` after fonts load and after media metadata loads, and make sure pin spacers are measured after layout settles.
8. **CTA repetition.** "Start a project" appears six times plus the form. Keep nav, hero, one mid-page band and the footer. Change the About button to a different action (for example "See how I work" linking to Process).
9. **Intro video slot.** Remove "Intro video · on its way". The "Meet the builder" section renders the video only when a video URL exists. Until then it leads with the agent feed, plus a photo if one is supplied.
10. **Live links.** Replace "Demo on request" with a real "Visit live site" button whenever the project has a `liveUrl`. Hide the row when it does not.
11. **Contact links.** Add optional `email`, `whatsapp`, `linkedin`, `github` to site config. Render only the ones that are set, in the contact section and footer, next to Instagram.
12. **FAQ.** Render from data. Add admin fields if missing. Do not write the questions; the owner will.
13. **Mobile.** The archive section is hidden at 375px: restore it as a compact list. Raise any text below 12px to at least 12px.

### Phase 2: media system

Build one `ProjectMedia` component and use it everywhere a project is shown: home case-study frames, archive cards, footer "Recent work" tiles, `/work`, and case study pages.

Data fields per project (add to the model and the admin panel):
- `poster` (image, required for media to render)
- `video` with `webm` and `mp4` sources (optional)
- `screens[]`: image, caption, `view` (`customer` | `owner`) (optional)
- `videoOwner` / `videoCustomer` for projects with two views (optional)

Behaviour:
- Fixed `aspect-ratio` on the wrapper. Poster through `next/image` with correct `sizes`.
- Video: `muted`, `playsInline`, `loop`, `preload="none"`. Play when at least 50% visible, pause when not (IntersectionObserver). Never autoplay under reduced motion or `Save-Data`.
- The Customer view / Owner view toggle crossfades between the two recordings (`--dur-base`) and keeps the frame size fixed.
- With no media, fall back to the current monogram tile. No empty frames.
- Archive cards and footer tiles show the poster. On fine pointers, hover plays the video if one exists.

### Phase 3: case study template and testimonials

Case study page sections. Each renders only when its field has content:
1. Hero: title, type, role, stack, live link, media.
2. **The problem**: what was slow, manual or broken, in the client's terms.
3. **Weak points of the old way**: a short list.
4. **What I built**: the existing three-layer diagram stays here.
5. **Key decisions**: two to four decisions, each with the trade-off.
6. **Screens**: gallery from `screens[]` with captions.
7. **Result / status**: real numbers or a real quote only. For a demo or product build this section says so plainly and states what the build proves.
8. **What I'd do next**.
9. Next case.

Testimonials:
- Model: `quote`, `name`, `role`, `company`, `photo?`, `projectSlug?`. Editable in the admin panel.
- One component, two placements: a home section after the case studies, and inside the matching case study.
- Renders nothing when there are zero testimonials.

### Phase 4: page transitions

Reference: https://nextjs.org/docs/app/guides/view-transitions (App Router, no config needed; `import { ViewTransition } from 'react'`).

1. Fix internal navigation so home → case study is a client-side route (`next/link`), not a document reload.
2. **Shared element morph.** Wrap the project media in the card and the media in the case study hero in `<ViewTransition name={`project-${slug}`} share="morph" default="none">`. The morph only plays when the destination is prefetched and renders in the same commit, so keep prefetch on for these links.
3. **Directional slides.** `transitionTypes={['nav-forward']}` on links going deeper, `['nav-back']` on "← All work". Put the wrapping `<ViewTransition>` in each `page.tsx`, not in the layout.
4. **Anchor the navbar.** Give it a `viewTransitionName`, set its group animation to `none`, and hide the old snapshot.
5. Add `::view-transition { pointer-events: none; }`.
6. Reduced motion: set all view-transition animation durations to 0.
7. Lenis: reset scroll to top on route change without a visible jump, and refresh ScrollTrigger after the transition ends.
8. The preloader must not replay on client-side navigation.

Timing: morph 400ms, old content out 150ms, new content in 210ms after a 150ms delay, slide offset 60px.

### Phase 5: playable demo

**Agent feed** ("This morning, from the agents"):
- Local state only, a fixed queue of example items, labelled "Example data".
- "Approve" stamps the card (reuse the existing stamp style from the order receipt), collapses it, and the next item slides in. "Skip" slides the card out without a stamp.
- A small counter shows items left.
- When the queue is empty: one line summarising what was just done, a CTA to the Brands Attire case study, and a "Replay" control.
- Fully keyboard operable. State changes are announced through an `aria-live` region.

**Order flow** (the pinned receipt sequence):
- At step 3 the "Approve dispatch" button on the receipt is real. Pressing it plays the step 4 transition immediately.
- Scrolling past step 3 without pressing still advances as it does today.

### Phase 6: paper section and editorial thread

1. Flip the **Process** section to paper: background `#F3EADB`, text `#111111`, and a darkened copper for accents that passes 4.5:1 contrast on cream. Cards become ink-outlined instead of glowing.
2. **Curtain transition.** The paper section rises over the dark section above it as a sheet with rounded top corners, and the corners flatten as it reaches the top of the viewport (scroll-scrubbed `clip-path` or `border-radius`). Reverse it on the way out into the next dark section. Under reduced motion it is a plain colour change.
3. The navbar must stay legible over paper. Check its contrast and adjust only its surface tokens if needed.
4. **Carry the magazine idea past the hero.** Add a small folio line to each section label (for example "The Build · No. 01 · p. 03") using the existing mono style. Show one pull quote from a testimonial as a large paper block when testimonials exist.

### Phase 7: signature and tactile details

1. **Masthead light.** "THE BUILD" gets a pointer-tracked highlight: a radial gradient layered into the text fill, positioned by `--mx` and `--my` custom properties, smoothed with a lerp in `requestAnimationFrame`. On touch devices, one slow sweep after the preloader ends. Static under reduced motion. No WebGL.
2. **Keycap press.** Primary and secondary buttons get a pressed state: `translateY(2px)`, shadow collapses, highlight dims, over `--dur-press`. Release springs back.
3. **Magnetic primary CTA.** Fine pointers only, hero and footer CTAs only, maximum pull 8px.
4. **Contextual cursor.** Fine pointers only, and only over case-study frames: a small label pill ("Open case →") follows the pointer. The native cursor stays visible everywhere else.
5. **Form receipt.** On a successful submit, the terminal line is replaced by a receipt that prints downward: name, project type, "Reply within one working day". Errors keep the current behaviour.
6. **Focus states.** Every input, button and link has a visible copper focus ring that matches the skeuomorphic style.

### Phase 8: QA

Report results. Do not just assert them.
- Lighthouse mobile for `/`, `/work` and one case study: Performance, Accessibility, CLS, LCP.
- DevTools at 4× CPU slowdown: scroll the whole home page and name any section that stutters.
- `prefers-reduced-motion: reduce`: walk every page.
- Keyboard only: reach and operate nav, case-study toggle, agent feed, FAQ, form.
- 375px, 768px, 1440px screenshots of each section.
- No console errors, no duplicate IDs, no horizontal scroll.

---

## 5. Acceptance checklist

- [ ] No placeholder text or empty frames anywhere.
- [ ] Every count on the site comes from data and agrees.
- [ ] Home → case study is a client-side route with a shared-element morph, and back reverses it.
- [ ] Videos never autoplay off-screen, under reduced motion, or with Save-Data.
- [ ] Agent feed and "Approve dispatch" work with mouse, touch and keyboard.
- [ ] At least one paper section breaks the dark run, with a scrubbed transition in and out.
- [ ] CLS under 0.1 on all three tested pages.
- [ ] No testimonial, metric, link or contact detail exists that the owner did not supply.

---

## 6. Assets the owner supplies

| Asset | Spec |
|---|---|
| Screen recordings | Record the browser at 1440×900, 8 to 15 seconds, one clear action per clip, no audio, 30fps. Export MP4 (H.264) and WebM. Aim for under 2 MB each. |
| Posters | First frame of each recording, exported as WebP at 1440×900. |
| Screenshots | 2880×1800 (2×), WebP, three to six per case study, each with a one-line caption and tagged customer or owner view. |
| Testimonials | Quote (one to three sentences), name, role, company, optional photo, and the person's permission to publish. |
| Case study copy | Problem, weak points of the old way, two to four decisions with trade-offs, result or status, next steps. |
| Contact | Email, WhatsApp, LinkedIn, GitHub: whichever should be public. |
| Photo | One portrait for "Meet the builder". |
| FAQ | Five to seven questions clients actually ask (price range, timelines, payment, maintenance, ownership of code). |

Phases 1, 4, 5, 6 and 7 need none of these. Phases 2 and 3 can be built and merged before the assets exist, because everything falls back cleanly.

---

## 7. Prompts

### Kickoff (paste once)

```
Read PORTFOLIO_BUILD_BRIEF.md in the repo root. It is the spec for this work.

Do Phase 0 only: survey the repo and report back. Do not edit any files yet.
Follow the ground rules in section 2 for everything that follows, especially:
no invented content, no new dependencies without asking, one phase per commit,
and stop after each phase.
```

### Per phase (paste for each phase, changing the number)

```
Do Phase N from PORTFOLIO_BUILD_BRIEF.md, and only Phase N.

Before coding, list the files you will change and anything in the brief that
does not match what you see in the repo. If something is ambiguous, ask.

When done: run the type check, lint and build, commit with message
"phase N: <summary>", then give me (1) what changed, (2) what I should check
by hand in the browser at 375px and 1440px, (3) anything you skipped and why.
Then stop.
```

### Review prompt (use in a fresh session after phases 4, 5 and 7)

```
Review the last commit against Phase N of PORTFOLIO_BUILD_BRIEF.md.
Check: reduced-motion fallbacks, keyboard access, layout shift, pointer
handlers throttled with requestAnimationFrame, hover effects gated to fine
pointers, and that no content was invented. List defects with file and line.
Do not fix anything yet.
```
