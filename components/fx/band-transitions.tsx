"use client";

import { isLowPowerDevice } from "@/lib/device-power";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { motionGrammar } from "@/lib/motion";

/**
 * Chapter transitions: every ink band opens out as it scrolls in, from a
 * rounded, inset panel to full bleed, like a screen sliding up into the page.
 * Mounted once per page; scans for [data-band="ink"].
 */
export function BandTransitions() {
  useGSAP(() => {
    if (isLowPowerDevice()) return;
    gsap.matchMedia().add(MQ.motion, () => {
      gsap.utils.toArray<HTMLElement>('[data-band="ink"]').forEach((band) => {
        gsap.fromTo(
          band,
          { clipPath: "inset(0% 3.5% 0% 3.5% round 40px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0px)",
            ease: "none",
            scrollTrigger: { trigger: band, start: "top bottom", end: "top 30%", scrub: motionGrammar.scrub },
          },
        );
      });
    });
  });
  return null;
}
