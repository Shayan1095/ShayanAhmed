"use client";

import { useEffect } from "react";

/**
 * Masthead light (build brief, Phase 7): a soft highlight in the "THE BUILD"
 * foil. Fine pointers: it follows the pointer, smoothed with a lerp in rAF.
 * Touch: one slow sweep once the intro has ended. Reduced motion: static.
 * Moves only --mx/--my, read by the masthead's radial-gradient layer.
 */
export function MastheadLight() {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>("[data-hero-masthead]");
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const set = (x: number, y: number) => {
      el.style.setProperty("--mx", `${x.toFixed(2)}%`);
      el.style.setProperty("--my", `${y.toFixed(2)}%`);
    };
    const OFF = -120; // the light parked above the letters

    if (window.matchMedia("(pointer: fine)").matches) {
      const area = el.closest("section") ?? el;
      let tx = 50,
        ty = OFF,
        x = tx,
        y = ty,
        raf = 0;
      const tick = () => {
        x += (tx - x) * 0.12;
        y += (ty - y) * 0.12;
        set(x, y);
        raf =
          Math.abs(tx - x) + Math.abs(ty - y) > 0.2
            ? requestAnimationFrame(tick)
            : 0;
      };
      const go = () => {
        if (!raf) raf = requestAnimationFrame(tick);
      };
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width) * 100;
        ty = ((e.clientY - r.top) / r.height) * 100;
        go();
      };
      const leave = () => {
        ty = OFF;
        go();
      };
      area.addEventListener("pointermove", move as EventListener);
      area.addEventListener("pointerleave", leave);
      return () => {
        cancelAnimationFrame(raf);
        area.removeEventListener("pointermove", move as EventListener);
        area.removeEventListener("pointerleave", leave);
      };
    }

    // Touch: one slow sweep, left to right, after the intro.
    const html = document.documentElement;
    let raf = 0,
      timer = 0,
      started = false;
    const sweep = () => {
      if (started) return;
      started = true;
      const t0 = performance.now(),
        D = 2400;
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / D);
        const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
        set(-30 + e * 160, 50);
        if (p < 1) raf = requestAnimationFrame(step);
        else set(50, OFF);
      };
      raf = requestAnimationFrame(step);
    };
    const ready = () => html.dataset.intro !== "play";
    const later = () => {
      timer = window.setTimeout(sweep, 900);
    };
    const mo = new MutationObserver(() => {
      if (ready()) {
        mo.disconnect();
        later();
      }
    });
    if (ready()) later();
    else
      mo.observe(html, { attributes: true, attributeFilter: ["data-intro"] });
    return () => {
      mo.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
