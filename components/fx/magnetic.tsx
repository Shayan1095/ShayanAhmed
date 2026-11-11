"use client";

import { useEffect, useRef } from "react";

/**
 * Magnetic pull (build brief, Phase 7): the wrapped CTA leans toward the
 * pointer, at most `max` px. Fine pointers only; still under reduced motion.
 * Moves a wrapper, so the button's own hover and press transforms still work.
 */
export function Magnetic({
  children,
  max = 8,
  className,
}: {
  children: React.ReactNode;
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (
      !el ||
      !window.matchMedia(
        "(pointer: fine) and (prefers-reduced-motion: no-preference)",
      ).matches
    )
      return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const c = (v: number) => Math.max(-1, Math.min(1, v)) * max;
      el.style.transform = `translate(${c(dx).toFixed(2)}px, ${c(dy).toFixed(2)}px)`;
    };
    const leave = () => {
      el.style.transform = "";
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [max]);
  return (
    <span
      ref={ref}
      data-magnetic=""
      className={`inline-flex transition-transform duration-[var(--dur-base)] ease-[var(--ease-out)] ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
