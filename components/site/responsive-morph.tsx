"use client";

import { ViewTransition } from "react";
import { usePhone } from "@/lib/use-phone";

/** Shared-element name for a project's screen: phones morph from the snap-row card, larger screens from the slide's monitor. */
export function morphName(slug: string, phone: boolean) {
  return `monitor-${phone ? "m-" : ""}${slug}`;
}

/** Wraps a project's picture so it morphs to/from its counterpart on the current screen size. */
export function ResponsiveMorph({ slug, children }: { slug: string; children: React.ReactNode }) {
  const phone = usePhone();
  return (
    <ViewTransition name={morphName(slug, phone)} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}
