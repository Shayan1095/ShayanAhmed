"use client";

import { Typewriter } from "./typewriter";
import { createContext, useContext, useImperativeHandle, useRef, useState } from "react";
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
/** Typewriter tied to its screen: types when the screen boots (or on `trigger`). */
export function TypeText({ text, speed = 22, delay = 0, trigger, as, className, caret = true }: TypeTextProps) {
  const bootCount = useScreenBoot();
  return (
    <Typewriter
      text={text}
      speed={speed}
      delay={delay}
      trigger={trigger ?? bootCount}
      caret={caret ? "typing" : false}
      as={as}
      className={className}
    />
  );
}
