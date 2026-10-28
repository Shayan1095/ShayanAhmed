"use client";

import { useSyncExternalStore } from "react";

/** Live media query match. Returns `serverValue` during SSR and hydration. */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");

/** Desktop pointer that can hover precisely (mouse, trackpad). */
export const useFinePointer = () => useMediaQuery("(hover: hover) and (pointer: fine)");
