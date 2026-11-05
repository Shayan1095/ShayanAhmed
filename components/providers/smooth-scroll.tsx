"use client";

import Lenis from "lenis";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { isLowPowerDevice, markLowPower } from "@/lib/device-power";
import { gsap, refreshScrollTriggers, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/use-media-query";

type ScrollTarget = string | HTMLElement | number;

type SmoothScrollApi = {
  /** Scroll to a selector ("#services"), element or y position. */
  scrollTo: (target: ScrollTarget, options?: { offset?: number; immediate?: boolean }) => void;
  stop: () => void;
  start: () => void;
};

const SmoothScrollContext = createContext<SmoothScrollApi | null>(null);

/**
 * Lenis driven by the GSAP ticker (DESIGN.md §6). Skipped entirely when the
 * visitor prefers reduced motion; scrollTo then jumps natively.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);

  // Web fonts change text heights (and SplitText lines), so re-measure every trigger once they load.
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => !cancelled && refreshScrollTriggers());
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Power tier: "low" on devices without GPU acceleration or that can't hold
    // the frame rate (cheaper surfaces, see [data-power="low"] in globals.css,
    // and native scrolling: inertia that lags behind the wheel feels worse
    // than none).
    const html = document.documentElement;
    let low = isLowPowerDevice();
    html.dataset.power = low ? "low" : "full";
    if (reduce || low) return;

    // Inertia scrolling: the page glides slightly behind the wheel for a weighted,
    // premium feel. anchors: plain <a href="#id"> links scroll smoothly too.
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, anchors: true });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    const off = () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };

    // Frame-rate check once the page settles: if this machine can't hold ~45fps,
    // drop to the low tier for the rest of the visit.
    let probe = 0;
    const start = window.setTimeout(() => {
      const times: number[] = [];
      let last = performance.now();
      const frame = (now: number) => {
        times.push(now - last);
        last = now;
        if (times.length < 60) {
          probe = requestAnimationFrame(frame);
          return;
        }
        const sorted = times.slice(5).sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        if (median > 22 && !low) {
          low = true;
          markLowPower();
          html.dataset.power = "low";
          off();
        }
      };
      probe = requestAnimationFrame(frame);
    }, 2500);

    return () => {
      window.clearTimeout(start);
      cancelAnimationFrame(probe);
      if (!low) off();
    };
  }, [reduce]);

  const scrollTo = useCallback<SmoothScrollApi["scrollTo"]>((target, options = {}) => {
    const { offset = 0, immediate = false } = options;
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, { offset, immediate, duration: 1.5 });
      return;
    }
    let y: number;
    if (typeof target === "number") {
      y = target;
    } else {
      const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
      if (!el) return;
      y = el.getBoundingClientRect().top + window.scrollY;
    }
    window.scrollTo({ top: y + offset, behavior: "auto" });
  }, []);

  const api = useMemo<SmoothScrollApi>(
    () => ({
      scrollTo,
      stop: () => lenisRef.current?.stop(),
      start: () => lenisRef.current?.start(),
    }),
    [scrollTo],
  );

  return <SmoothScrollContext.Provider value={api}>{children}</SmoothScrollContext.Provider>;
}

export function useSmoothScroll(): SmoothScrollApi {
  const ctx = useContext(SmoothScrollContext);
  if (!ctx) throw new Error("useSmoothScroll must be used inside <SmoothScrollProvider>");
  return ctx;
}
