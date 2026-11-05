"use client";

import { useRef } from "react";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { isLowPowerDevice } from "@/lib/device-power";
import { motionGrammar } from "@/lib/motion";

/**
 * Scroll-linked effects (GSAP ScrollTrigger, scrubbed). Mark descendants with
 * data attributes and pick effects by name:
 *
 *  rise      [data-fx="item"]     y + fade, staggered, tied to scroll
 *  fan       [data-fx="item"]     items fan in from their side toward place
 *  draw      [data-fx="line"]     scaleX (or scaleY with data-fx-axis="y") 0 → 1
 *  stroke    [data-fx="stroke"]   an SVG path draws itself along its length (DrawSVG)
 *  parallax  [data-fx-speed="n"]  moves at its own speed through the section;
 *                                 data-fx-rotate="deg" also turns it to 0 at centre
 *  tilt      [data-fx="tilt"]     straightens from a slight rotateX and rises
 *  progress  [data-fx-step]       steps gain data-on as scroll passes them
 *
 * Transform and opacity only. Skipped on low-power devices (except progress). Off with reduced motion, where content simply sits in place.
 */
export type FxName = "rise" | "fan" | "draw" | "stroke" | "parallax" | "tilt" | "progress";

type ScrollFxProps = Omit<React.ComponentProps<"div">, "ref"> & {
  effects: FxName[];
  as?: "div" | "section" | "ol" | "ul" | "article";
};

export function ScrollFx({ effects, as = "div", children, ...props }: ScrollFxProps) {
  const root = useRef<HTMLElement>(null);
  const key = effects.join(",");

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      gsap.matchMedia().add(MQ.motion, () => {
        const q = gsap.utils.selector(el);
        const scrub = motionGrammar.scrub;
        const items = q('[data-fx="item"]');
        // Low-power devices: content simply sits in place (no per-frame scroll
        // work); the progress steps still light up.
        const lite = isLowPowerDevice();

        if (!lite && effects.includes("rise") && items.length) {
          gsap.fromTo(
            items,
            { y: 70, opacity: 0.2 },
            {
              y: 0,
              opacity: 1,
              ease: motionGrammar.ease,
              stagger: 0.12,
              scrollTrigger: { trigger: el, start: "top 92%", end: "top 40%", scrub },
            },
          );
        }

        if (!lite && effects.includes("fan") && items.length) {
          const mid = (items.length - 1) / 2;
          items.forEach((it, i) => {
            const side = i - mid;
            gsap.fromTo(
              it,
              { x: side * 46, y: 60 + Math.abs(side) * 24, rotate: side * 2.5, opacity: 0.25 },
              {
                x: 0,
                y: 0,
                rotate: 0,
                opacity: 1,
                ease: motionGrammar.ease,
                scrollTrigger: { trigger: el, start: "top 95%", end: "top 35%", scrub },
              },
            );
          });
        }

        if (!lite && effects.includes("draw")) {
          q('[data-fx="line"]').forEach((line) => {
            const y = line.dataset.fxAxis === "y";
            gsap.fromTo(
              line,
              { [y ? "scaleY" : "scaleX"]: 0 },
              {
                [y ? "scaleY" : "scaleX"]: 1,
                ease: "none",
                transformOrigin: y ? "50% 0%" : "0% 50%",
                scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 65%", scrub },
              },
            );
          });
        }

        if (!lite && effects.includes("stroke")) {
          q('[data-fx="stroke"]').forEach((path) => {
            gsap.fromTo(
              path,
              { drawSVG: "0%" },
              {
                drawSVG: "100%",
                ease: "none",
                scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 65%", scrub },
              },
            );
          });
        }

        if (!lite && effects.includes("parallax")) {
          q("[data-fx-speed]").forEach((it) => {
            const speed = Number(it.dataset.fxSpeed) || 0;
            const rot = Number(it.dataset.fxRotate) || 0;
            gsap.fromTo(
              it,
              { y: speed * 90, rotate: rot },
              {
                y: speed * -90,
                rotate: -rot * 0.4,
                ease: "none",
                scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub },
              },
            );
          });
        }

        if (!lite && effects.includes("tilt")) {
          q('[data-fx="tilt"]').forEach((it) => {
            gsap.fromTo(
              it,
              { rotateX: 14, y: 90, opacity: 0.35, transformPerspective: 1400, transformOrigin: "50% 100%" },
              {
                rotateX: 0,
                y: 0,
                opacity: 1,
                ease: motionGrammar.ease,
                scrollTrigger: { trigger: it, start: "top 98%", end: "top 50%", scrub },
              },
            );
          });
        }

        if (effects.includes("progress")) {
          const steps = q("[data-fx-step]");
          const set = (p: number) => steps.forEach((s, i) => s.toggleAttribute("data-on", p >= (i + 0.35) / steps.length));
          gsap.timeline({
            scrollTrigger: {
              trigger: el,
              start: "top 75%",
              end: "bottom 55%",
              scrub,
              onUpdate: (self) => set(self.progress),
              onRefresh: (self) => set(self.progress),
            },
          });
          return () => steps.forEach((s) => s.setAttribute("data-on", ""));
        }
      });
    },
    { scope: root, dependencies: [key] },
  );

  const Tag = as as "div";
  return (
    <Tag ref={root as React.Ref<HTMLDivElement>} {...props}>
      {children}
    </Tag>
  );
}
