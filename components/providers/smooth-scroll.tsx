"use client";

import Lenis from "lenis";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { isLowPowerDevice } from "@/lib/device-power";
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
    // Low-power devices (no GPU acceleration, weak CPU) get native scrolling and
    // simpler surfaces: smooth-scroll interpolation costs a frame they don't have.
    const low = isLowPowerDevice();
    document.documentElement.dataset.power = low ? "low" : "full";
    if (reduce || low) return;

    // anchors: plain <a href="#id"> links scroll smoothly, and still jump without JS.
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, anchors: true });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
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
