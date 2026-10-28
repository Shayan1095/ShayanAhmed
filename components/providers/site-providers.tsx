"use client";

import { MotionConfig } from "motion/react";
import { pressSpring } from "@/lib/motion";
import { SmoothScrollProvider } from "./smooth-scroll";

/** Providers for the public site. The admin panel does not use these. */
export function SiteProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={pressSpring}>
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
    </MotionConfig>
  );
}
