"use client";

/**
 * Wordmark with Variable Proximity, adapted from React Bits (MIT, reactbits.dev):
 * letters widen along Anybody's width axis as the cursor gets close.
 * Writes styles directly per frame instead of re-rendering.
 */
import { useEffect, useRef } from "react";
import { useFinePointer, useReducedMotion } from "@/hooks/use-media-query";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { motionGrammar } from "@/lib/motion";
import { cn } from "@/lib/utils";

const MIN_WDTH = 75;
const MAX_WDTH = 125; // Archivo's widest
const RADIUS = 320;

const LIT: React.CSSProperties = {
  backgroundImage: "linear-gradient(180deg, #f6c487 0%, #e09a4f 34%, #c9853f 56%, #8a521a 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

/**
 * `huge`: the footer's finale, the name spanning the full width of the screen.
 * Its letters widen less near the cursor so the name never outgrows the edge.
 */
export function Wordmark({ text, className, huge = false }: { text: string; className?: string; huge?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    // Listen on the footer so the effect starts before the cursor reaches the letters.
    const area = el?.closest("footer") ?? el;
    if (!el || !area || !fine || reduce) return;
    const letters = Array.from(el.querySelectorAll<HTMLSpanElement>("[data-letter]"));
    let frame = 0;

    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        for (const s of letters) {
          const r = s.getBoundingClientRect();
          const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
          const k = Math.max(0, 1 - d / RADIUS);
          const max = huge ? MIN_WDTH + 14 : MAX_WDTH;
          s.style.fontVariationSettings = `"wdth" ${Math.round(MIN_WDTH + k * (max - MIN_WDTH))}`;
        }
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      for (const s of letters) s.style.fontVariationSettings = "";
    };

    area.addEventListener("pointermove", onMove as EventListener);
    area.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      area.removeEventListener("pointermove", onMove as EventListener);
      area.removeEventListener("pointerleave", onLeave);
      onLeave();
    };
  }, [fine, reduce, huge]);

  // Scroll-linked finale: letters rise one after another as the page ends.
  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      gsap.matchMedia().add(MQ.motion, () => {
        gsap.fromTo(
          el.querySelectorAll("[data-letter]"),
          { yPercent: 70, opacity: 0.15 },
          {
            yPercent: 0,
            opacity: 1,
            ease: motionGrammar.ease,
            stagger: 0.06,
            // Ends with the page: in the footer finale the name is the last thing, so its bottom meets the screen bottom.
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom bottom", scrub: 0.8 },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    // Sized to the container (cqi), so the full name always fits its width.
    <div className={cn("@container", className)}>
    <div
      ref={root}
      role="img"
      aria-label={text}
      // Soft copper glow around the lit letters (inline so it can never be lost to stale CSS).
      style={{
        filter: "drop-shadow(0 0 22px rgb(224 154 79 / 0.32)) drop-shadow(0 1px 0 rgb(0 0 0 / 0.6))",
        // Huge: condensed by default, so the full name spans the screen at a bigger size.
        ...(huge && { fontVariationSettings: '"wdth" 75' }),
      }}
      className={cn(
        "flex select-none justify-between whitespace-nowrap font-display font-black uppercase leading-[0.85] tracking-[-0.04em]",
        huge ? "text-[14cqi] leading-[0.8]" : "text-[min(11cqi,184px)]",
      )}
    >
      {Array.from(text).map((ch, i) => (
        <span
          key={i}
          data-letter
          aria-hidden="true"
          className="inline-block transition-[font-variation-settings] duration-200 ease-out forced-colors:text-[CanvasText]"
          // Each letter carries the full copper gradient, so it survives the per-letter rise and width animation.
          style={LIT}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </div>
    </div>
  );
}
