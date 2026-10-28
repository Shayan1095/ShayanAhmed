"use client";

/**
 * Magnet, adapted from React Bits (MIT, reactbits.dev). Same behaviour as the
 * original, but writes the transform straight to the element instead of
 * re-rendering on every mouse move. Desktop with a fine pointer only.
 */
import { useEffect, useRef } from "react";
import { useFinePointer, useReducedMotion } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type MagnetProps = {
  children: React.ReactNode;
  /** Distance in px outside the element where the pull starts. */
  padding?: number;
  /** Higher is weaker. */
  strength?: number;
  disabled?: boolean;
  className?: string;
};

export function Magnet({ children, padding = 40, strength = 4, disabled, className }: MagnetProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const active = fine && !reduce && !disabled;

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!active || !wrap || !inner) return;

    let pulled = false;
    let frame = 0;

    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = wrap.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const near =
          Math.abs(cx - e.clientX) < r.width / 2 + padding &&
          Math.abs(cy - e.clientY) < r.height / 2 + padding;
        if (near) {
          pulled = true;
          inner.style.transition = "transform .3s var(--ease-out-expo)";
          inner.style.transform = `translate3d(${(e.clientX - cx) / strength}px, ${(e.clientY - cy) / strength}px, 0)`;
        } else if (pulled) {
          pulled = false;
          inner.style.transition = "transform .6s var(--ease-out-expo)";
          inner.style.transform = "translate3d(0, 0, 0)";
        }
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      inner.style.transform = "";
      inner.style.transition = "";
    };
  }, [active, padding, strength]);

  return (
    <span ref={wrapRef} className={cn("relative inline-flex", className)}>
      <span ref={innerRef} className="inline-flex w-full will-change-transform">
        {children}
      </span>
    </span>
  );
}
