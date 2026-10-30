"use client";

/**
 * Single place where GSAP plugins are registered. Import gsap and its
 * plugins from here, never from "gsap" directly, so registration always runs.
 * GSAP owns scroll and timelines; Motion owns component state (DESIGN.md §3.1).
 *
 * All of these ship free with the gsap package (formerly Club plugins):
 *  CustomEase      the site's signature curves ("sa.out", "sa.inOut", "sa.settle")
 *  Flip            layout changes that glide (archive filter)
 *  DrawSVGPlugin   strokes that draw with scroll (flow lines, diagrams)
 *  MorphSVGPlugin  shapes that melt into each other (menu icon)
 *  ScrambleTextPlugin  terminal-style text changes (navbar section readout)
 *  Observer        drag/swipe input (work rail)
 */
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { Observer } from "gsap/Observer";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(
  ScrollTrigger,
  SplitText,
  CustomEase,
  Flip,
  DrawSVGPlugin,
  MorphSVGPlugin,
  ScrambleTextPlugin,
  Observer,
  useGSAP,
);

/**
 * Signature curves. One motion language across the site:
 *  sa.out     fast start, long soft landing (entrances, reveals)
 *  sa.inOut   weighted both ways (toggles, morphs, layout moves)
 *  sa.settle  slight overshoot then rest (numbers landing, keys)
 */
CustomEase.create("sa.out", "M0,0 C0.12,0.72 0.2,0.96 0.42,0.99 0.6,1 0.78,1 1,1");
CustomEase.create("sa.inOut", "M0,0 C0.55,0 0.18,1 1,1");
CustomEase.create("sa.settle", "M0,0 C0.18,0.7 0.32,1.06 0.56,1.03 0.74,1.005 0.86,1 1,1");

export { CustomEase, DrawSVGPlugin, Flip, gsap, MorphSVGPlugin, Observer, ScrambleTextPlugin, ScrollTrigger, SplitText, useGSAP };

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
