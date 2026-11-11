"use client";

import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Curtain (build brief, Phase 6): the paper section rises over the dark page
 * as a sheet with rounded top corners that flatten as it reaches the top of
 * the screen, and its bottom corners round again as the next dark section
 * comes up over it. Scroll-scrubbed CSS variables read by .tone-cream's
 * clip-path; no layout change. Reduced motion: a plain colour change.
 */
export function CurtainBand({ target }: { target: string }) {
  useGSAP(() => {
    const el = document.querySelector<HTMLElement>(target);
    if (!el) return;
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      const r = window.innerWidth < 900 ? 28 : 56;
      const scrub = 0.3;
      gsap.fromTo(
        el,
        { "--curtain-top": `${r}px` },
        {
          "--curtain-top": "0px",
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "top top",
            scrub,
          },
        },
      );
      gsap.fromTo(
        el,
        { "--curtain-bottom": "0px" },
        {
          "--curtain-bottom": `${r}px`,
          ease: "none",
          immediateRender: false,
          scrollTrigger: {
            trigger: el,
            start: "bottom bottom",
            end: "bottom top",
            scrub,
          },
        },
      );
    });
  });
  return null;
}
