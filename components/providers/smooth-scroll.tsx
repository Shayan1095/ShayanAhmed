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

  // Off-screen sections render lazily (content-visibility in globals.css), so
  // the page's height changes as they come into view: re-measure triggers then.
  useEffect(() => {
    const main = document.getElementById("main");
    if (!main) return;
    let t = 0;
    let last = main.offsetHeight;
    const ro = new ResizeObserver(() => {
      if (main.offsetHeight === last) return;
      last = main.offsetHeight;
      window.clearTimeout(t);
      t = window.setTimeout(refreshScrollTriggers, 150);
    });
    ro.observe(main);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    // Power tier: "low" on devices without GPU acceleration or that can't hold
    // the frame rate. They get cheaper surfaces ([data-power="low"] in
    // globals.css) but keep smooth scrolling and the scroll effects.
    const html = document.documentElement;
    const low = isLowPowerDevice();
    html.dataset.power = low ? "low" : "full";
    if (reduce) return;
    const touch = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // Inertia scrolling: the page glides slightly behind the wheel for a weighted,
    // premium feel. anchors: plain <a href="#id"> links scroll smoothly too.
    // Low power: a snappier glide, so it never trails far behind the wheel.
    // Phones (syncTouch): the page follows the finger with the same weighted
    // glide, and a flick carries less far than native momentum. Sideways swipes
    // (work cards) and sheets/menus (data-lenis-prevent) keep native scrolling.
    const lenis = new Lenis({
      lerp: low ? 0.12 : 0.1,
      wheelMultiplier: 1,
      smoothWheel: true,
      anchors: true,
      syncTouch: touch,
      syncTouchLerp: low ? 0.1 : 0.075,
      touchInertiaExponent: 1.55,
      allowNestedScroll: true,
    });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Frame-rate check once the page settles: a machine that can't hold ~45fps
    // gets the cheaper surfaces and the snappier glide for the rest of the visit.
    let probe = 0;
    const start = window.setTimeout(() => {
      if (low) return;
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
        if (sorted[Math.floor(sorted.length / 2)] > 22) {
          markLowPower();
          html.dataset.power = "low";
          lenis.options.lerp = 0.12;
        }
      };
      probe = requestAnimationFrame(frame);
    }, 2500);

    return () => {
      window.clearTimeout(start);
      cancelAnimationFrame(probe);
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
