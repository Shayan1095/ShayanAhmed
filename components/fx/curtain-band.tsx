"use client";

import { gsap, useGSAP } from "@/lib/gsap";

const CORNERS = ["tl", "tr", "bl", "br"] as const;

/**
 * Curtain (build brief, Phase 6): the paper section rises over the dark page
 * as a sheet with rounded top corners that flatten as it reaches the top of
 * the screen, and its bottom corners round again as the next dark section
 * comes up over it. The corners are four small page-coloured pieces that only
 * scale (compositor work, no repaint of the section). Hidden by default, so
 * reduced motion is a plain colour change. Render it inside the section.
 */
export function CurtainBand() {
  useGSAP(() => {
    const el =
      document.querySelector<HTMLElement>("[data-curtain]")?.parentElement;
    if (!el) return;
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      const q = (k: string) =>
        el.querySelectorAll<HTMLElement>(`[data-curtain="${k}"]`);
      const scrub = 0.3;
      gsap.fromTo(
        [...q("tl"), ...q("tr")],
        { scale: 1 },
        {
          scale: 0,
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
        [...q("bl"), ...q("br")],
        { scale: 0 },
        {
          scale: 1,
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
  return (
    <>
      {CORNERS.map((c) => (
        <span
          key={c}
          aria-hidden="true"
          data-curtain={c}
          className="curtain-corner"
        />
      ))}
    </>
  );
}
