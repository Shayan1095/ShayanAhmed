import { ViewTransition } from "react";

/**
 * Directional page slides (build brief, Phase 4). Each page.tsx wraps its
 * content in this (never the layout). Links tagged "nav-forward" (going
 * deeper, e.g. into a case study) slide the new page in from the right;
 * "nav-back" (← All work) from the left. Untyped transitions (browser back,
 * refresh, Suspense reveals) don't slide. Timings live in globals.css.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const slide = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };
  return (
    <ViewTransition enter={slide} exit={slide} default="none">
      {children}
    </ViewTransition>
  );
}
