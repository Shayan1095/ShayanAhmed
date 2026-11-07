"use client";

import { useRef } from "react";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { motionGrammar } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * RollingNumber: digits roll into place like an odometer. Works on any
 * string ("2 hrs → 10 min", "1,240", "98%"): each digit gets its own reel,
 * everything else stays put.
 *
 * Rolls when it scrolls into view; afterwards, a changed value rolls from
 * the old digits to the new ones (live counters). The real value is always
 * in the HTML for screen readers and search engines; reduced motion shows it
 * at once. Tabular figures keep the width steady while rolling.
 */
export function RollingNumber({
  value,
  className,
  duration = 1.4,
  stagger = 0.07,
}: {
  value: string | number;
  className?: string;
  duration?: number;
  stagger?: number;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const seen = useRef(false);
  const text = String(value);
  const chars = Array.from(text);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const reels = Array.from(el.querySelectorAll<HTMLElement>("[data-reel]"));
      const target = (r: HTMLElement) => -Number(r.dataset.reel) * 10;

      // The server renders each reel already at its digit (a CSS translateY %),
      // which GSAP would read as a pixel offset and add to yPercent: hand the
      // position over to yPercent alone.
      if (!seen.current) gsap.set(reels, { y: 0, yPercent: (_: number, r: HTMLElement) => target(r) });
      const mm = gsap.matchMedia();
      mm.add(MQ.reduce, () => {
        reels.forEach((r) => gsap.set(r, { yPercent: target(r) }));
      });
      mm.add(MQ.motion, () => {
        if (seen.current) {
          // Live update: roll from where each reel is to its new digit.
          gsap.to(reels, { yPercent: (_, r: HTMLElement) => target(r), duration: 0.8, ease: motionGrammar.easeSettle, stagger: 0.04 });
          return;
        }
        // First view: every reel spins up from 0 and lands, right to left.
        gsap.set(reels, { yPercent: 0 });
        gsap.to(reels, {
          yPercent: (_, r: HTMLElement) => target(r),
          duration,
          ease: motionGrammar.easeSettle,
          stagger: { each: stagger, from: "end" },
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
          onStart: () => {
            seen.current = true;
          },
        });
      });
    },
    { scope: root, dependencies: [text] },
  );

  return (
    <span ref={root} className={cn("inline-flex items-baseline tabular-nums", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {chars.map((c, i) =>
          /\d/.test(c) ? (
            <span key={i} className="relative inline-block h-[1em] overflow-hidden leading-none" style={{ verticalAlign: "-0.1em" }}>
              {/* Invisible digit sets the reel's width. */}
              <span className="invisible">{c}</span>
              <span data-reel={c} className="absolute inset-x-0 top-0 flex flex-col will-change-transform" style={{ transform: `translateY(${-Number(c) * 10}%)` }}>
                {Array.from({ length: 10 }, (_, d) => (
                  <span key={d} className="block h-[1em] leading-none">
                    {d}
                  </span>
                ))}
              </span>
            </span>
          ) : (
            <span key={i} className="whitespace-pre">
              {c}
            </span>
          ),
        )}
      </span>
    </span>
  );
}
