"use client";

/**
 * Single place where GSAP plugins are registered. Import gsap and its
 * plugins from here, never from "gsap" directly, so registration always runs.
 * GSAP owns scroll and timelines; Motion owns component state (DESIGN.md §3.1).
 *
 * All of these ship free with the gsap package (formerly Club plugins):
 *  CustomEase      the site's signature curves ("sa.out", "sa.inOut", "sa.settle")
 *  Observer        drag/swipe input (work rail)
 *
 * Loaded on demand (kept out of the first download; see lazyPlugin below):
 *  Flip            layout changes that glide (archive filter)
 *  MorphSVGPlugin  shapes that melt into each other (menu icon)
 *  ScrambleTextPlugin  terminal-style text changes (navbar section readout)
 */
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import type { Flip as FlipPlugin } from "gsap/Flip";
import { Observer } from "gsap/Observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(
  ScrollTrigger,
  SplitText,
  CustomEase,
  Observer,
  useGSAP,
);

/**
 * Signature curves. One motion language across the site:
 *  sa.out     fast start, long soft landing (entrances, reveals)
 *  sa.inOut   weighted both ways (toggles, morphs, layout moves)
 *  sa.settle  slight overshoot then rest (numbers landing, keys)
 */
// Phones: Safari's address bar showing or hiding changes the viewport height
// on every scroll; re-measuring for it made the page jump. Ignore it.
ScrollTrigger.config({ ignoreMobileResize: true });

CustomEase.create("sa.out", "M0,0 C0.12,0.72 0.2,0.96 0.42,0.99 0.6,1 0.78,1 1,1");
CustomEase.create("sa.inOut", "M0,0 C0.55,0 0.18,1 1,1");
CustomEase.create("sa.settle", "M0,0 C0.18,0.7 0.32,1.06 0.56,1.03 0.74,1.005 0.86,1 1,1");

export { CustomEase, gsap, Observer, ScrollTrigger, SplitText, useGSAP };

/**
 * A plugin fetched only when first needed, then registered. `get()` returns
 * it once ready (undefined before), so callers can skip the flourish instead
 * of waiting; `load()` starts (or reuses) the download.
 */
function lazyPlugin<T extends object>(fetch: () => Promise<T>) {
  let ready: T | undefined;
  let pending: Promise<T> | undefined;
  return {
    get: () => ready,
    load: () =>
      (pending ??= fetch().then((p) => {
        gsap.registerPlugin(p);
        ready = p;
        return p;
      })),
  };
}

export const lazyFlip = lazyPlugin(() => import("gsap/Flip").then((m) => m.Flip));
export const lazyMorphSVG = lazyPlugin(() => import("gsap/MorphSVGPlugin").then((m) => m.MorphSVGPlugin));
export const lazyScrambleText = lazyPlugin(() => import("gsap/ScrambleTextPlugin").then((m) => m.ScrambleTextPlugin));
export type FlipState = ReturnType<typeof FlipPlugin.getState>;

/** Runs `fn` when the browser is idle (or after a short delay where that isn't supported). */
export function whenIdle(fn: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(fn, { timeout: 2500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 1200);
  return () => window.clearTimeout(id);
}

/**
 * Re-measure every ScrollTrigger in page order. Call after anything that
 * changes layout above other triggers (a pin created late, fonts loading),
 * otherwise later sections fire at stale scroll positions.
 */
export function refreshScrollTriggers() {
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}

/** Media queries for gsap.matchMedia(). */
export const MQ = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  desktop: "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
  finePointer: "(pointer: fine) and (prefers-reduced-motion: no-preference)",
} as const;
