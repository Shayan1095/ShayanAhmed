"use client";

/**
 * Wordmark with Variable Proximity, adapted from React Bits (MIT, reactbits.dev):
 * letters widen along Anybody's width axis as the cursor gets close.
 * Writes styles directly per frame instead of re-rendering.
 */
import { useEffect, useRef } from "react";
import { useFinePointer, useReducedMotion } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const MIN_WDTH = 80;
const MAX_WDTH = 150;
const RADIUS = 320;

export function Wordmark({ text, className }: { text: string; className?: string }) {
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
          s.style.fontVariationSettings = `"wdth" ${Math.round(MIN_WDTH + k * (MAX_WDTH - MIN_WDTH))}`;
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
  }, [fine, reduce]);

  return (
    // Sized to the container (cqi), so the full name always fits its width.
    <div className={cn("@container", className)}>
    <div
      ref={root}
      role="img"
      aria-label={text}
      className={cn(
        "flex select-none justify-between whitespace-nowrap font-display font-black uppercase leading-[0.85] tracking-[-0.04em] text-paper",
        "text-[min(11cqi,184px)] [text-shadow:0_1px_0_rgb(255_255_255/.9),0_-1px_0_rgb(17_17_17/.24),0_-2px_4px_rgb(17_17_17/.08)]",
      )}
    >
      {Array.from(text).map((ch, i) => (
        <span
          key={i}
          data-letter
          aria-hidden="true"
          className="inline-block transition-[font-variation-settings] duration-200 ease-out [font-variation-settings:'wdth'_100]"
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </div>
    </div>
  );
}
