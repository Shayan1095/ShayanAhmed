"use client";

import { useRef, useState } from "react";
import type { Project } from "@/lib/content/types";
import { useSmoothScroll } from "@/components/providers/smooth-scroll";
import { Band, Label, RollingNumber, SplitReveal, Typewriter } from "@/components/system";
import { gsap, Observer, useGSAP } from "@/lib/gsap";
import { motionGrammar } from "@/lib/motion";
import { WorkSlide } from "./work-slide";

/**
 * 01 Selected work (cream), straight after the hero: proof first. Desktop: the band pins and the rail slides
 * sideways, fragments drift at their own speeds. Mobile / reduced motion: stacked.
 */
export function Work({ projects }: { projects: Project[] }) {
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  // Which slide is in view; the counter rolls between numbers (RollingNumber).
  const [current, setCurrent] = useState(1);
  const total = projects.length;
  const { scrollTo } = useSmoothScroll();

  useGSAP(
    () => {
      if (total < 2) return;
      gsap.matchMedia().add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
        const railEl = rail.current!;
        const distance = () => Math.max(0, railEl.scrollWidth - railEl.parentElement!.clientWidth + 120);
        const frags = gsap.utils.toArray<HTMLElement>("[data-frag]", railEl);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pin.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: motionGrammar.scrub,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const n = Math.min(total, Math.floor(self.progress * total) + 1);
              setCurrent((c) => (c === n ? c : n));
            },
          },
        });
        tl.to(railEl, { x: () => -distance(), ease: "none" }, 0);
        for (const f of frags) {
          const s = Number(f.dataset.speed) || 0;
          tl.fromTo(f, { x: s * 30, y: s * -45 }, { x: s * -30, y: s * 45, ease: "none" }, 0);
        }

        // Keyboard users: focusing inside a slide scrolls the page to that slide.
        const slides = gsap.utils.toArray<HTMLElement>("[data-slide]", railEl);
        const onFocus = (e: FocusEvent) => {
          const i = slides.findIndex((s) => s.contains(e.target as Node));
          const st = tl.scrollTrigger;
          if (i < 0 || !st) return;
          const y = st.start + (st.end - st.start) * (i / Math.max(1, slides.length - 1));
          if (Math.abs(window.scrollY - y) > 4) scrollTo(y, { immediate: true });
        };
        railEl.addEventListener("focusin", onFocus);

        // Drag the rail (GSAP Observer). Dragging moves the page in step with the rail;
        // letting go throws it on with momentum, which Lenis eases out.
        const st = tl.scrollTrigger!;
        const pxPerScroll = () => distance() / Math.max(1, st.end - st.start);
        const clampY = (y: number) => gsap.utils.clamp(st.start, st.end, y);
        let dragged = false;
        const drag = Observer.create({
          target: railEl,
          type: "pointer",
          dragMinimum: 6,
          onDragStart: () => {
            dragged = true;
            railEl.classList.add("cursor-grabbing");
          },
          onDrag: (self) => scrollTo(clampY(window.scrollY - self.deltaX / pxPerScroll()), { immediate: true }),
          onDragEnd: (self) => {
            railEl.classList.remove("cursor-grabbing");
            const fling = (-self.velocityX / pxPerScroll()) * 0.35;
            scrollTo(clampY(window.scrollY + fling));
            // Let the click that ends a drag through only if it wasn't a drag.
            window.setTimeout(() => (dragged = false), 0);
          },
        });
        const blockClickAfterDrag = (e: MouseEvent) => {
          if (dragged) {
            e.preventDefault();
            e.stopPropagation();
          }
        };
        railEl.addEventListener("click", blockClickAfterDrag, true);
        const noNativeDrag = (e: DragEvent) => e.preventDefault();
        railEl.addEventListener("dragstart", noNativeDrag);
        railEl.classList.add("cursor-grab", "select-none");

        return () => {
          railEl.removeEventListener("focusin", onFocus);
          railEl.removeEventListener("click", blockClickAfterDrag, true);
          railEl.removeEventListener("dragstart", noNativeDrag);
          railEl.classList.remove("cursor-grab", "select-none", "cursor-grabbing");
          drag.kill();
        };
      });
    },
    { scope: root, dependencies: [total, scrollTo] },
  );

  if (total === 0) return null;

  return (
    <Band ref={root} id="work" aria-label="Selected work" className="border-t border-paper-edge/70">
      <div
        ref={pin}
        className="flex flex-col justify-center overflow-clip py-20 min-[900px]:min-h-svh min-[900px]:pb-10 min-[900px]:pt-24"
      >
        <div className="wrap">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-6 [@media(min-width:900px)_and_(max-height:820px)]:mb-6">
            <div>
              <Label className="block">
                <Typewriter text="01 · Selected work" speed={38} />
              </Label>
              <SplitReveal className="type-section mt-[18px]">
                Case <em>studies</em>
              </SplitReveal>
            </div>
            <div className="flex items-center gap-3.5" aria-hidden="true">
              <b
                className="font-display text-[40px] font-extrabold leading-none tabular-nums [font-variation-settings:'wdth'_120]"
              >
                <RollingNumber value={String(current).padStart(2, "0")} />
              </b>
              <Label>/ {String(total).padStart(2, "0")} shipped</Label>
            </div>
          </div>
        </div>
        <div className="wrap">
          <div ref={rail} className="flex flex-col gap-16 will-change-transform min-[900px]:flex-row min-[900px]:gap-10">
            {projects.map((p, i) => (
              <WorkSlide key={p.slug} project={p} index={i} />
            ))}
          </div>
        </div>
      </div>
    </Band>
  );
}
