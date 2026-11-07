"use client";

import { useEffect } from "react";

/** Surface colours, matching globals.css (hero cover, ink bands, espresso). */
const SURFACE = { hero: "#120c08", ink: "#0b0a09", espresso: "#1a1511" } as const;

/**
 * The phone browser's bar takes the colour of the chapter under it
 * (<meta name="theme-color">), so the page and the browser read as one.
 * Watches a thin strip at the top of the viewport; public site only.
 */
export function ThemeColorSync() {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const main = document.getElementById("main");
    if (!meta || !main) return;
    const initial = meta.content;
    const colourOf = (el: Element) =>
      el.id === "hero"
        ? SURFACE.hero
        : el.matches('[data-band="ink"], .ink-band, footer, :has(> footer)')
          ? SURFACE.ink
          : SURFACE.espresso;

    let current = "";
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const c = colourOf(e.target);
          if (c !== current) meta.content = current = c;
        }
      },
      // A 2px line just under the fixed header: whichever chapter crosses it wins.
      { rootMargin: `-80px 0px -${Math.max(0, window.innerHeight - 82)}px 0px` },
    );
    for (const el of Array.from(main.children)) io.observe(el);
    const footer = document.querySelector("footer");
    if (footer) io.observe(footer);
    return () => {
      io.disconnect();
      meta.content = initial;
    };
  }, []);
  return null;
}
