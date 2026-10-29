"use client";

import { createContext, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { isLowPowerDevice } from "@/lib/device-power";
import { bootScreen } from "@/lib/screen-boot";
import { cn } from "@/lib/utils";

export type ScreenHandle = {
  /** Replay the boot flicker, then re-type any <TypeText> inside. */
  boot: () => void;
};

type ScreenProps = Omit<React.ComponentProps<"div">, "ref"> & {
  ref?: React.Ref<ScreenHandle>;
  /** view: boot once when scrolled into view. mount: boot on load. manual: only via ref. */
  bootOn?: "view" | "mount" | "manual";
  /** Delay before a mount boot, in seconds. */
  bootDelay?: number;
};

/** Increments every time the parent screen boots. 0 = never booted. */
const ScreenBootContext = createContext(0);
export const useScreenBoot = () => useContext(ScreenBootContext);

/**
 * Ink screen (DESIGN.md §5, material 3): radial highlight, scanlines, gloss.
 * Every screen boots with the shared flicker on enter. Do not animate this
 * element with anything else: GSAP owns its filter.
 */
export function Screen({ ref, bootOn = "view", bootDelay = 0, className, children, ...props }: ScreenProps) {
  const el = useRef<HTMLDivElement>(null);
  const [bootCount, setBootCount] = useState(0);

  const run = () => {
    // No flicker with reduced motion or on low-power devices (a filter animation repaints every frame).
    if (!el.current || window.matchMedia(MQ.reduce).matches || isLowPowerDevice()) return;
    bootScreen(el.current, () => setBootCount((c) => c + 1));
  };

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        if (bootOn === "view") {
          ScrollTrigger.create({ trigger: el.current, start: "top 88%", once: true, onEnter: run });
        } else if (bootOn === "mount") {
          gsap.delayedCall(bootDelay, run);
        }
      });
    },
    { scope: el, dependencies: [bootOn, bootDelay] },
  );

  useImperativeHandle(ref, () => ({ boot: contextSafe(run) }), [contextSafe]);

  return (
    <div ref={el} className={cn("ink-screen tone-ink rounded-control", className)} {...props}>
      <ScreenBootContext.Provider value={bootCount}>{children}</ScreenBootContext.Provider>
    </div>
  );
}

type TypeTextProps = {
  text: string;
  /** ms per character. */
  speed?: number;
  /** ms before typing starts, after the trigger. */
  delay?: number;
  /** Re-types whenever this changes (> 0). Defaults to the parent screen's boot count. */
  trigger?: number;
  as?: "span" | "div" | "p" | "dd";
  className?: string;
  caret?: boolean;
};

/**
 * Text that types in. The full text is in the HTML (readable without JS and by
 * screen readers); typing only starts after a trigger, and never with reduced motion.
 */
export function TypeText({ text, speed = 22, delay = 0, trigger, as: Tag = "span", className, caret = true }: TypeTextProps) {
  const bootCount = useScreenBoot();
  const key = trigger ?? bootCount;
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    if (!key || window.matchMedia(MQ.reduce).matches) return;
    let n = 0;
    const step = () => {
      n += 1;
      setShown(n >= text.length ? null : n);
      if (n < text.length) timer = window.setTimeout(step, speed);
    };
    // Blank the line first so it types from empty, then start after the delay.
    let timer = window.setTimeout(() => {
      setShown(0);
      timer = window.setTimeout(step, delay);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key, text, speed, delay]);

  const typing = shown !== null;
  const inline = Tag === "span";

  return (
    <Tag className={cn(inline ? "inline-grid" : "grid", className)}>
      <span className="sr-only">{text}</span>
      {/* Invisible copy reserves the final size so nothing reflows while typing. */}
      <span aria-hidden="true" className="invisible [grid-area:1/1]">
        {text}
      </span>
      <span aria-hidden="true" className="[grid-area:1/1]">
        {typing ? text.slice(0, shown) : text}
        {typing && caret && (
          <span className="ml-px inline-block h-[1em] w-[0.5em] translate-y-[0.15em] bg-copper/80" />
        )}
      </span>
    </Tag>
  );
}
