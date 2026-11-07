"use client";

import { useEffect, useRef, useState } from "react";
import { Label, TypeText } from "@/components/system";
import { cn } from "@/lib/utils";

export type ProcessStep = { title: string; text: string; get: string };

/**
 * Process signature (motion spec, Phase 4): the ruler. A vertical ruler with
 * ticks every 40px (the preloader's ruler language). As you reach each step,
 * copper ink fills the ruler down to it and the step "inks in": it starts as
 * a blueprint (dashed border, faint but readable, crop marks) and becomes
 * solid; its number stamps in and the "You get" line types out.
 *
 * Cards stack as they pass (CSS sticky, each a little lower). No pinning and
 * no per-frame scroll work: one IntersectionObserver per card, once each.
 * Phones: ruler on the left edge. Desktop: ruler centred, cards alternate.
 * Without JS or with reduced motion every step is shown inked.
 */
export function ProcessRuler({ steps }: { steps: ProcessStep[] }) {
  const list = useRef<HTMLOListElement>(null);
  // Index of the furthest step reached; -1 until JS runs and arms the blueprints.
  const [reached, setReached] = useState(steps.length - 1);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = list.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-step]"));
    // Arm on the next frame: the blueprints appear only once JS can ink them.
    const raf = requestAnimationFrame(() => {
      setArmed(true);
      setReached(-1);
    });
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = cards.indexOf(e.target as HTMLElement);
          setReached((r) => Math.max(r, i));
          io.unobserve(e.target);
        }
      },
      // A step inks in as its top crosses ~60% of the screen.
      { rootMargin: "0px 0px -40% 0px" },
    );
    cards.forEach((c) => io.observe(c));
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [steps.length]);

  const fill = steps.length ? (reached + 1) / steps.length : 0;

  return (
    <ol ref={list} className="relative flex flex-col gap-5 pl-12 min-[900px]:gap-10 min-[900px]:pl-0">
      {/* The ruler: track, ticks every 40px, and the copper ink that fills it. */}
      <li
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-[14px] top-0 w-5 min-[900px]:left-1/2 min-[900px]:-translate-x-1/2"
      >
        <span className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 bg-paper-edge" />
        <span className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 bg-[repeating-linear-gradient(180deg,var(--color-paper-edge)_0_1.5px,transparent_1.5px_40px)]" />
        <span
          className="absolute inset-y-0 left-1/2 w-[2px] origin-top -translate-x-1/2 bg-[linear-gradient(180deg,#9e6034,#f2cc9c_70%,#fbe3c2)] shadow-glow transition-transform duration-700 ease-out-expo"
          style={{ transform: `translateX(-50%) scaleY(${fill})` }}
        />
      </li>

      {steps.map((s, i) => {
        const inked = !armed || i <= reached;
        return (
          <li
            key={s.title}
            data-step
            data-on={inked ? "" : undefined}
            className={cn(
              // Sticky stacking: each card holds a little lower than the last.
              "sticky min-[900px]:w-[calc(50%-56px)]",
              i % 2 === 1 && "min-[900px]:ml-auto",
            )}
            style={{ top: `calc(var(--stack-top) + ${i * 14}px)` }}
          >
            {/* The step's mark on the ruler. */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute -left-[30px] top-7 size-3 rounded-full border-[1.5px] transition-[background-color,border-color,box-shadow] duration-500",
                "min-[900px]:top-8",
                i % 2 === 0 ? "min-[900px]:-right-[62px] min-[900px]:left-auto" : "min-[900px]:-left-[62px]",
                inked ? "border-copper bg-copper shadow-glow" : "border-paper-edge bg-paper",
              )}
            />
            <article
              className={cn(
                "relative flex flex-col gap-2.5 rounded-[20px] border-[1.5px] p-6 transition-[background-color,border-color,box-shadow] duration-500 min-[900px]:p-7",
                inked ? "border-solid border-copper/55 bg-paper-hi shadow-raised" : "border-dashed border-copper/35 bg-paper",
              )}
            >
              {/* Blueprint crop marks; they fade once the step is inked. */}
              {(["left-2 top-2 border-l border-t", "right-2 top-2 border-r border-t", "bottom-2 left-2 border-b border-l", "bottom-2 right-2 border-b border-r"] as const).map((pos) => (
                <span
                  key={pos}
                  aria-hidden="true"
                  className={cn("absolute size-3 border-copper/60 transition-opacity duration-500", pos, inked ? "opacity-0" : "opacity-100")}
                />
              ))}
              <span
                key={inked ? "on" : "off"}
                className={cn(
                  // self-start: the box hugs the digits, so the stamp's scale never spills past the edge.
                  "self-start font-display text-[34px] font-extrabold leading-none",
                  inked ? "text-copper [text-shadow:0_0_18px_rgb(201_133_63/.4)]" : "text-copper/35",
                  // Stamp only when a step inks in as you scroll, not on the first paint.
                  inked && armed && "process-stamp",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className={cn("mt-1 font-display text-[22px] font-extrabold leading-[1.1] transition-colors duration-500", !inked && "text-ink/60")}>
                {s.title}
              </h3>
              <p className={cn("text-[16px] transition-colors duration-500", inked ? "text-muted" : "text-muted/70")}>{s.text}</p>
              <p className="mt-2 border-t border-dashed border-paper-edge pt-3 text-[15px]">
                <Label className="mb-1 block">You get</Label>
                <TypeText as="span" text={s.get} trigger={armed && inked ? 1 : 0} speed={26} caret={false} className="font-mono text-[13.5px]" />
              </p>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
