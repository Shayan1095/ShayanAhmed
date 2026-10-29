"use client";

import { useRef } from "react";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { motionGrammar } from "@/lib/motion";

/**
 * Drives the Process rack. Desktop: the panel pins and scroll plays the
 * sequence — the copper rail fills, and each step in turn rises, lights and
 * takes focus while the steps already done settle back. Small screens: each
 * step rises and lights as it scrolls through. Off with reduced motion.
 */
export function ProcessTrack({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const steps = q("[data-step]");
      const rail = q("[data-rail]");
      const light = (n: number) => steps.forEach((s, i) => s.toggleAttribute("data-on", i < n));
      const mm = gsap.matchMedia();

      mm.add(MQ.desktop, () => {
        light(0);
        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: {
            trigger: el,
            // Heading and panel pin together; centred when they fit, else near the top.
            start: () => (el.offsetHeight > window.innerHeight - 120 ? "top top+=90" : "center center"),
            end: () => `+=${window.innerHeight * motionGrammar.maxPin}`,
            pin: true,
            scrub: motionGrammar.scrub,
            refreshPriority: -1,
            onUpdate: (self) => light(Math.min(steps.length, Math.floor(self.progress * steps.length + 0.6))),
          },
        });
        gsap.set(steps, { y: 24, opacity: 0.28, scale: 0.97, transformOrigin: "50% 100%" });
        gsap.set(rail, { scaleX: 0, transformOrigin: "0% 50%" });
        tl.to(rail, { scaleX: 1, ease: "none", duration: steps.length }, 0);
        steps.forEach((s, i) => {
          tl.to(s, { y: 0, opacity: 1, scale: 1, duration: 0.55 }, i);
          // Earlier steps step back a little once the next one takes focus.
          if (i > 0) tl.to(steps[i - 1], { opacity: 0.62, duration: 0.45 }, i);
        });
        // End with every step fully readable.
        tl.to(steps, { opacity: 1, duration: 0.4 }, steps.length - 0.4);
        return () => light(steps.length);
      });

      mm.add("(max-width: 899px) and (prefers-reduced-motion: no-preference)", () => {
        light(0);
        gsap.set(rail, { scaleX: 0, transformOrigin: "0% 50%" });
        gsap.to(rail, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 75%", end: "bottom 60%", scrub: motionGrammar.scrub },
        });
        steps.forEach((s) => {
          gsap.fromTo(
            s,
            { y: 50, opacity: 0.3 },
            {
              y: 0,
              opacity: 1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: s,
                start: "top 92%",
                end: "top 60%",
                scrub: motionGrammar.scrub,
                onUpdate: (self) => s.toggleAttribute("data-on", self.progress > 0.6),
              },
            },
          );
        });
        return () => light(steps.length);
      });
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      {children}
    </div>
  );
}
