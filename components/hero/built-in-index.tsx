"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BUILT_IN, BUILT_IN_INTERVAL_MS, COVER, FOIL } from "./hero-data";

const pad = (n: number) => String(n).padStart(2, "0");
const EASE = [0.16, 0.84, 0.24, 1] as const;

/**
 * "What's built in": cycles through the six systems every 3.6s (brief §7).
 * Clicking a segment jumps there and restarts the timer. Auto-advance pauses
 * while the tab is hidden and while the panel is hovered or focused (moving
 * content must be stoppable). Reduced motion: no roll, no auto-advance.
 * Screen readers hear a change only when the visitor picks one, not every
 * 3.6s. The body has a fixed height so nothing below it ever shifts.
 */
export function BuiltInIndex() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [announce, setAnnounce] = useState("");
  const [held, setHeld] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [cycle, setCycle] = useState(0); // bumping it restarts the timer
  const panel = useRef<HTMLElement>(null);
  const swipeX = useRef<number | null>(null);

  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (reduce || held || hidden) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % BUILT_IN.length), BUILT_IN_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [reduce, held, hidden, cycle]);

  const pick = useCallback((k: number) => {
    setIndex(k);
    setCycle((c) => c + 1);
    setAnnounce(`${pad(k + 1)} of ${pad(BUILT_IN.length)}: ${BUILT_IN[k].title}. ${BUILT_IN[k].desc}`);
  }, []);

  const item = BUILT_IN[index];
  // The server renders the roll's start state, so reduced motion still needs an
  // (instant) move to the end state, or the text would stay hidden.
  const roll = reduce
    ? { animate: { y: 0, opacity: 1 }, transition: { duration: 0 } }
    : {
        // Transform and opacity only (a blur filter on gradient text is costly on modest machines).
        initial: { y: "100%", opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { duration: 0.9, ease: EASE },
      };

  return (
    <aside
      ref={panel}
      aria-label="What's built in"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => !panel.current?.contains(e.relatedTarget as Node) && setHeld(false)}
      className="flex w-full max-w-[420px] flex-[1_1_340px] flex-col gap-[18px] pt-3.5"
      style={{ borderTop: `1.5px solid ${COVER.copper}` }}
    >
      <p className="m-0 flex justify-between font-mono text-[11px] uppercase tracking-[0.16em]">
        <span style={{ color: COVER.copper }}>What&apos;s built in</span>
        <span style={{ color: COVER.muted3 }} aria-hidden="true">
          {pad(index + 1)} / {pad(BUILT_IN.length)}
        </span>
      </p>

      {/* Phones: swipe sideways to move through the systems (vertical scrolling still works). */}
      <div
        className="flex h-[150px] touch-pan-y items-start gap-5 overflow-hidden"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") swipeX.current = e.clientX;
        }}
        onPointerUp={(e) => {
          const from = swipeX.current;
          swipeX.current = null;
          if (from === null) return;
          const dx = e.clientX - from;
          if (Math.abs(dx) < 40) return;
          pick((index + (dx < 0 ? 1 : -1) + BUILT_IN.length) % BUILT_IN.length);
        }}
        onPointerCancel={() => (swipeX.current = null)}
      >
        {/* Odometer: each digit is its own reel, so only the digit that changes rolls. */}
        <span className="flex flex-none">
          {Array.from(pad(index + 1)).map((d, i) => (
            <Mask key={i}>
              <motion.span
                key={`n${i}-${d}`}
                {...roll}
                className="inline-block font-[family-name:var(--font-archivo)] text-[112px] font-black leading-[0.82] tracking-[-0.02em]"
                style={{ ...FOIL, fontStretch: "62%", fontVariationSettings: "'wdth' 62" }}
              >
                {d}
              </motion.span>
            </Mask>
          ))}
        </span>
        <div className="flex min-w-0 flex-col gap-2.5 pt-1.5">
          <Mask>
            <motion.span key={`t${index}`} {...roll} className="inline-block font-[family-name:var(--font-archivo)] text-[28px] font-bold leading-[1.05] tracking-[-0.01em]" style={{ color: COVER.paper }}>
              {item.title}
            </motion.span>
          </Mask>
          <Mask>
            <motion.span key={`d${index}`} {...roll} className="inline-block text-[15px] leading-[1.55]" style={{ color: COVER.muted }}>
              {item.desc}
            </motion.span>
          </Mask>
        </div>
      </div>

      <div role="group" aria-label="Choose a system" className="grid grid-cols-6 gap-1.5">
        {BUILT_IN.map((it, k) => (
          <button
            key={it.title}
            type="button"
            aria-label={it.title}
            aria-pressed={k === index}
            onClick={() => pick(k)}
            // 44px tall to tap (the -my keeps the row 28px high visually).
            className="-my-2 flex h-11 cursor-pointer items-center bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ outlineColor: COVER.copper }}
          >
            <span
              aria-hidden="true"
              className="relative block h-0.5 w-full overflow-hidden transition-colors duration-300"
              style={{ background: k < index ? "rgba(232,178,122,.45)" : "rgba(243,234,219,.16)" }}
            >
              {/* The current system's bar fills over the time it is shown, pausing with the cycle. */}
              {k === index && (
                <span
                  key={`${index}-${cycle}`}
                  className="absolute inset-0 origin-left"
                  style={{
                    background: COVER.copper,
                    animation: reduce ? undefined : `bi-fill ${BUILT_IN_INTERVAL_MS}ms linear both`,
                    animationPlayState: held || hidden ? "paused" : "running",
                  }}
                />
              )}
            </span>
          </button>
        ))}
      </div>

      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </aside>
  );
}

/** Clips the roll-in; a little bottom padding keeps descenders whole. */
function Mask({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block overflow-hidden align-bottom ${className ?? ""}`} style={{ padding: "0 .08em .14em", margin: "0 -.08em -.14em" }}>
      {children}
    </span>
  );
}
