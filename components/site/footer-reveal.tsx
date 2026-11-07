"use client";

import { isLowPowerDevice } from "@/lib/device-power";
import { gsap, MQ, useGSAP } from "@/lib/gsap";

/**
 * The footer's curtain (desktop): as the page ends, the footer's content
 * rises from slightly beneath, as if the page were lifting away to reveal it.
 * One transform, scroll-linked. Off on phones, low-power devices and with
 * reduced motion, where the footer simply sits in place.
 */
export function FooterReveal() {
  useGSAP(() => {
    if (isLowPowerDevice()) return;
    gsap.matchMedia().add(MQ.desktop, () => {
      const inner = document.querySelector<HTMLElement>("footer [data-footer-inner]");
      const footer = inner?.closest("footer");
      if (!inner || !footer) return;
      gsap.fromTo(
        inner,
        { yPercent: -18, opacity: 0.35 },
        {
          yPercent: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: footer, start: "top bottom", end: "bottom bottom", scrub: true },
        },
      );
    });
  });
  return null;
}
