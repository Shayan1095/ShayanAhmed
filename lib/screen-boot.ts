"use client";

import { gsap } from "@/lib/gsap";

/**
 * The site-wide motif: an ink screen flickers awake like a monitor
 * (brightness 0 → .6 → .06 → .85 → .25 → 1, about 0.5s). Use on ink screens only.
 */
export function bootScreen(el: Element, onStart?: () => void): gsap.core.Timeline {
  return gsap
    .timeline({ onStart })
    .set(el, { filter: "brightness(0)" })
    .to(el, { filter: "brightness(0.6)", duration: 0.05 })
    .to(el, { filter: "brightness(0.06)", duration: 0.06 })
    .to(el, { filter: "brightness(0.85)", duration: 0.05 })
    .to(el, { filter: "brightness(0.25)", duration: 0.05 })
    .to(el, { filter: "brightness(1)", duration: 0.3, ease: "power2.out", clearProps: "filter" });
}
