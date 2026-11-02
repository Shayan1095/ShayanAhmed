"use client";

import { useRef } from "react";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type VelocityMarqueeProps = {
  items: string[];
  tone?: "paper" | "ink";
  className?: string;
};

/**
 * A band of large display type that drifts sideways forever. Scroll speed
 * pushes it faster (and reverses it when scrolling up) and leans the letters,
 * then it eases back to its idle drift. Transforms only.
 */
export function VelocityMarquee({ items, tone = "paper", className }: VelocityMarqueeProps) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = track.current;
      if (!el) return;
      gsap.matchMedia().add(MQ.motion, () => {
        // The track holds two identical runs; moving it by half its width loops seamlessly.
        const loop = gsap.to(el, { xPercent: -50, ease: "none", duration: 38, repeat: -1 });
        const setSkew = gsap.quickSetter(el, "skewX", "deg");
        let direction = 1;
        let lean = 0;
        let target = 0;
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const v = self.getVelocity();
            if (v !== 0) direction = v > 0 ? 1 : -1;
            const boost = Math.min(5, Math.abs(v) / 300);
            target = gsap.utils.clamp(-8, 8, v / -260);
            gsap.to(loop, { timeScale: direction * (1 + boost), duration: 0.25, overwrite: true });
            gsap.to(loop, { timeScale: direction, duration: 1.2, delay: 0.25, ease: "power2.out" });
          },
        });
        // Ease the lean toward the latest target, and the target back to upright.
        const tick = () => {
          if (!st.isActive && Math.abs(lean) < 0.01) return;
          target *= 0.9;
          lean += (target - lean) * 0.12;
          setSkew(lean);
        };
        gsap.ticker.add(tick);
        return () => gsap.ticker.remove(tick);
      });
    },
    { scope: root },
  );

  const run = (copy: number) => (
    <div className="flex shrink-0 items-center" aria-hidden={copy === 1 || undefined}>
      {items.map((t) => (
        <span key={`${copy}-${t}`} className="flex items-center">
          <span className="whitespace-nowrap px-[0.35em]">{t}</span>
          <i aria-hidden="true" className="inline-block size-[0.16em] rounded-full bg-copper shadow-[0_0_0.25em_rgb(201_133_63/.7)]" />
        </span>
      ))}
    </div>
  );

  return (
    <div
      ref={root}
      className={cn(
        "relative overflow-clip py-4 min-[900px]:py-6",
        tone === "ink" ? "tone-ink ink-band text-paper" : "text-ink",
        className,
      )}
    >
      <p className="sr-only">{items.join(", ")}</p>
      <div
        ref={track}
        aria-hidden="true"
        className="flex w-max font-display text-[clamp(22px,3vw,42px)] font-extrabold uppercase leading-none tracking-[-0.035em] will-change-transform [font-variation-settings:'wdth'_112]"
      >
        {run(0)}
        {run(1)}
      </div>
    </div>
  );
}
