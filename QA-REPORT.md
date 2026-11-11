# QA report (build brief, Phase 8)

Measured on 11 November 2026 against a production build (`next build` + `next start`) with the
test database. Re-run any time with:

```bash
QA=1 npx playwright test e2e/qa.spec.ts --workers=1
```

Results land in `e2e/.results/qa/qa.json`, with section screenshots at 375, 768 and 1440 px beside it.

## 1. Load (phone 375×812, CPU slowed 4×, fast-4G network)

Lighthouse is not installed in the project (adding it needs your OK), so these numbers come from
the browser's own performance APIs under Lighthouse-like throttling.

| Page | LCP | LCP element | CLS | Load event |
|---|---|---|---|---|
| `/` | 3.1 s | hero intro paragraph | 0.031 | 4.2 s |
| `/work` | 1.6 s | "Builds that run businesses." | 0.014 | 2.8 s |
| `/work/brands-attire` | 2.7 s | cover image | **0.140** | 3.3 s |

- **Case-study CLS 0.14 (target under 0.1).** Cause: the heading font (Archivo) arrives about
  2.6 s into a slow first visit, and the hero heading shrinks by 33 px when it swaps in, so the
  panel below moves up. On a normal connection, or a second visit, the shift is under 0.001.
  The fix is a trade-off for the owner (see "Open decisions").
- **Home LCP 3.1 s** includes the intro. The LCP element is text, not an image.

## 2. Accessibility (axe, WCAG 2 A and AA, reduced motion)

No violations on `/`, `/work` or `/work/brands-attire`, at 375 px or 1440 px.
The existing homepage contrast test also passes with the cream Process section.

## 3. Scroll at 4× CPU slowdown (long frames over 50 ms, by section)

| Section | Desktop 1440 | Phone 375 |
|---|---|---|
| Hero | 15 (worst 683 ms*) | 6 (233 ms) |
| Meet the builder | 12 (317 ms) | 1 (67 ms) |
| Work | 27 (583 ms*) | 4 (100 ms) |
| **Services** | **69 (267 ms)** | 8 (267 ms) |
| Archive | 18 (900 ms*) | 3 (267 ms) |
| Process | 15 (83 ms) | 10 (167 ms) |
| About | 13 (83 ms) | 4 (83 ms) |
| Contact | 29 (167 ms) | 7 (4.9 s*) |
| Footer | 41 (283 ms) | 5 (3.0 s*) |

\* Single spikes: a lazy chunk or an image decoding as it scrolls into view, not steady stutter.

- **Services stutters on desktop.** It has the most slow frames: the pinned order-flow stage
  redraws the receipt while it scrubs. The footer reveal is second.
- **Process was fixed in this phase.** Its curtain re-clipped the whole section on every frame
  (44 slow frames, worst 467 ms). It now scales four small corner pieces: 15 slow frames,
  worst 83 ms.

## 4. Reduced motion

Every page (`/`, `/work`, a case study and the 404 page) shows all headings and paragraphs, with
none left invisible by a reveal that never ran, and no script errors. The curtain is a plain
colour change and the masthead light is static.

## 5. Keyboard only

Tab from the top of the home page reaches the navbar, the case-study Customer/Owner toggle, the
agent feed (Approve and Skip) and the contact form's Send button. All 32 stops show a visible
copper focus ring, or the form fields' copper underline. Each control is operated in the tests
(`navbar`, `demo`, `media`, `public`).

The FAQ was not reached because the test database has no published questions, so the section
does not render. Each question is a `<button aria-expanded>` (the Drawer component), so it opens with Enter or
Space.

## 6. Layout

- No horizontal scroll on any page at 375, 768 or 1440 px.
- No duplicate IDs on any page at any width.
- The only elements past the right edge at 1440 px are the Work slides in their horizontal
  track, which is intended and clipped.

## 7. Console

No JavaScript errors on any page. The only console messages are 404s for media IDs in the test
database that no longer have files, and one external host the offline test machine cannot
resolve. Both come from the test data and do not happen on the live site's content.

## Open decisions

1. **Case-study font shift.** Either switch Archivo to `display: "optional"` (no shift ever, but
   a slow first visit may show the fallback font for that page, masthead included), or accept
   0.14 on slow first visits only. Recommendation: keep it as it is, and revisit once real
   field data from Vercel Speed Insights is available.
2. **Lighthouse.** Approve adding it as a dev-only tool to get the official scores, or run
   PageSpeed Insights on the live site after pushing.
3. **Services stage.** Profiling and lightening the pinned order-flow stage is a separate
   task.
