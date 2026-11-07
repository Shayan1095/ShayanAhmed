"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import { pressSpring } from "@/lib/motion";
import { SmoothScrollProvider } from "./smooth-scroll";

// Motion's engine arrives after hydration; until then components render in place.
const motionFeatures = () => import("./motion-features").then((mod) => mod.default);

/**
 * Providers for the public site. The admin panel does not use these.
 * Site components use Motion's lightweight `m` elements inside LazyMotion.
 */
export function SiteProviders({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={motionFeatures}>
      <MotionConfig reducedMotion="user" transition={pressSpring}>
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </MotionConfig>
    </LazyMotion>
  );
}
