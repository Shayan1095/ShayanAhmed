"use client";

import { useRef } from "react";
import { Screen } from "@/components/system";
import { gsap, MQ, useGSAP } from "@/lib/gsap";

/**
 * HTML version of the footer slab (DESIGN.md §8 Footer). Its screen powers down
 * as the page ends. The 3D slab replaces this in step 7 and keeps it as fallback.
 */
export function FooterSlab() {
  const root = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const led = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MQ.motion, () => {
        gsap
          .timeline({
            scrollTrigger: { trigger: root.current, start: "top 75%", end: "max", scrub: 0.8 },
          })
          .to(shade.current, { opacity: 0.94, ease: "power2.in" }, 0)
          .to(led.current, { opacity: 0.15, ease: "power2.in" }, 0);
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden="true" className="w-[min(420px,100%)] [transform:rotate(-3deg)]">
      <div className="relative rounded-[18px] bg-[linear-gradient(160deg,var(--color-paper-hi),var(--color-paper-lo))] p-2.5 shadow-raised">
        <span
          ref={led}
          className="absolute -top-px right-6 h-1 w-6 rounded-b-sm bg-copper shadow-glow"
        />
        <div className="relative aspect-[3.38/2.08] overflow-hidden rounded-[11px]">
          {/* glass: storefront area on top, live strip at the bottom */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-paper-hi),var(--color-paper-lo))]">
            <div className="flex h-[73%] flex-col justify-between p-4">
              <div className="flex items-center justify-between">
                <span className="h-2 w-16 rounded-full bg-paper-edge" />
                <span className="flex gap-1.5">
                  <i className="block h-2 w-8 rounded-full bg-paper-edge/70" />
                  <i className="block h-2 w-8 rounded-full bg-paper-edge/70" />
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <i className="block aspect-[4/5] rounded-md bg-paper-edge/60" />
                <i className="block aspect-[4/5] rounded-md bg-paper-edge/60" />
                <i className="block aspect-[4/5] rounded-md bg-paper-edge/60" />
              </div>
            </div>
          </div>
          <Screen bootOn="view" className="absolute inset-x-0 bottom-0 h-[27%] rounded-none border-t border-copper/60">
            <div className="relative z-[3] flex h-full items-center gap-3 px-4 font-mono text-[11px] tracking-[0.06em]">
              <span className="text-copper">›</span>
              <span>Session complete · Thanks for scrolling</span>
            </div>
          </Screen>
          <div ref={shade} className="pointer-events-none absolute inset-0 z-10 bg-ink opacity-0" />
        </div>
      </div>
    </div>
  );
}
