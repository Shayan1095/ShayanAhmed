"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { FooterState } from "@/components/hero/three/footer-scene";
import { hasWebGL } from "@/components/hero/three/shared";
import { Screen } from "@/components/system";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

const FooterScene = dynamic(() => import("@/components/hero/three/footer-scene"), { ssr: false });

/**
 * Footer slab (DESIGN.md §8 Footer). The same device returns small and its
 * screen powers down as the page ends. HTML slab everywhere; on capable
 * desktops the 3D slab loads as the footer approaches and crossfades over it.
 */
export function FooterSlab() {
  const root = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const led = useRef<HTMLSpanElement>(null);
  const footState = useRef<FooterState>({ level: 1, invalidate: () => {} });
  const [three, setThree] = useState(false);
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);

  // Load the 3D chunk only when the footer is close; render only while visible.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const nearIo = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "600px 0px" });
    const viewIo = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    nearIo.observe(el);
    viewIo.observe(el);
    return () => {
      nearIo.disconnect();
      viewIo.disconnect();
    };
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "top 75%", end: "max", scrub: 0.8 } })
          .to(shade.current, { opacity: 0.94, ease: "power2.in" }, 0)
          .to(led.current, { opacity: 0.15, ease: "power2.in" }, 0)
          .fromTo(
            footState.current,
            { level: 1 },
            { level: 0.06, ease: "power2.in", onUpdate: () => footState.current.invalidate() },
            0,
          );
      });
      mm.add(MQ.desktop, () => {
        if (hasWebGL()) setThree(true);
        return () => {
          setThree(false);
          setReady(false);
        };
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden="true" className="relative grid w-[420px] max-w-full place-items-center">
      <div className={cn("w-full transition-opacity duration-700 [transform:rotate(-3deg)]", ready && "opacity-0")}>
        <div className="relative rounded-[18px] bg-[linear-gradient(160deg,var(--color-paper-hi),var(--color-paper-lo))] p-2.5 shadow-raised">
          <span ref={led} className="absolute -top-px right-6 h-1 w-6 rounded-b-sm bg-copper shadow-glow" />
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

      {three && near && (
        <div
          className={cn(
            "absolute left-1/2 top-1/2 aspect-[7/5] w-[118%] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700",
            ready ? "opacity-100" : "opacity-0",
          )}
        >
          <FooterScene stateRef={footState} active={inView} onReady={() => setReady(true)} />
        </div>
      )}
    </div>
  );
}
