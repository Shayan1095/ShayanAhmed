"use client";

import { useEffect, useRef } from "react";

/**
 * Contextual cursor (build brief, Phase 7): over a case-study frame
 * ([data-case-frame]) a small "Open case →" pill follows the pointer. Fine
 * pointers only; the native cursor stays visible everywhere. Decorative.
 */
export function CaseCursor() {
  const pill = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = pill.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    let tx = 0,
      ty = 0,
      x = 0,
      y = 0,
      raf = 0,
      on = false;
    const place = () => {
      el.style.transform = `translate3d(${x + 16}px, ${y + 18}px, 0)`;
    };
    const tick = () => {
      x += (tx - x) * 0.25;
      y += (ty - y) * 0.25;
      place();
      raf =
        on && Math.abs(tx - x) + Math.abs(ty - y) > 0.3
          ? requestAnimationFrame(tick)
          : 0;
    };
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const over = !!(e.target as Element | null)?.closest?.(
        "[data-case-frame]",
      );
      if (over !== on) {
        on = over;
        if (over) el.dataset.on = "";
        else delete el.dataset.on;
        if (over) {
          x = tx;
          y = ty;
          place();
        }
      }
      if (!on) return;
      if (!smooth) {
        x = tx;
        y = ty;
        place();
      } else if (!raf) raf = requestAnimationFrame(tick);
    };
    const out = () => {
      on = false;
      delete el.dataset.on;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", out);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", out);
    };
  }, []);
  return (
    <span
      ref={pill}
      aria-hidden="true"
      data-case-cursor=""
      className="pointer-events-none fixed left-0 top-0 z-[90] rounded-full bg-copper px-3.5 py-1.5 text-[13px] font-bold text-[#140d08] opacity-0 shadow-[0_8px_20px_-8px_rgb(0_0_0/.6)] transition-opacity duration-[var(--dur-fast)] data-[on]:opacity-100"
    >
      Open case →
    </span>
  );
}
