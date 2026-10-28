"use client";

import { useRef } from "react";
import { gsap, MQ, SplitText, useGSAP } from "@/lib/gsap";
import { motionGrammar } from "@/lib/motion";

type RevealTag = "h1" | "h2" | "h3" | "p" | "div" | "span";

type SplitRevealProps = Omit<React.ComponentProps<"h2">, "ref"> & {
  as?: RevealTag;
  /** ScrollTrigger start. */
  start?: string;
};

/**
 * Heading reveal (DESIGN.md §6): split by lines, masked, each line rises from
 * yPercent 110, once. The text is plain HTML until JS splits it.
 */
export function SplitReveal({ as = "h2", start = motionGrammar.heading.start, children, ...props }: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const { yPercent, duration, stagger } = motionGrammar.heading;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap.matchMedia().add(MQ.motion, () => {
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent,
              duration,
              stagger,
              ease: motionGrammar.ease,
              scrollTrigger: { trigger: el, start, once: true },
            }),
        });
      });
    },
    { scope: ref },
  );

  const Tag = as as "h2";
  return (
    <Tag ref={ref as React.Ref<HTMLHeadingElement>} {...props}>
      {children}
    </Tag>
  );
}

type RiseProps = Omit<React.ComponentProps<"div">, "ref"> & {
  as?: RevealTag | "article" | "li" | "section";
  start?: string;
  delay?: number;
};

/**
 * The shared content reveal: y 40 → 0, once. Transform only, so the block is
 * always visible. Never wrap a Screen or a Motion-animated element directly.
 */
export function Rise({ as = "div", start = motionGrammar.block.start, delay = 0, children, ...props }: RiseProps) {
  const ref = useRef<HTMLElement>(null);
  const { y, duration } = motionGrammar.block;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap.matchMedia().add(MQ.motion, () => {
        gsap.from(el, {
          y,
          duration,
          delay,
          ease: motionGrammar.ease,
          scrollTrigger: { trigger: el, start, once: true },
        });
      });
    },
    { scope: ref },
  );

  const Tag = as as "div";
  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} {...props}>
      {children}
    </Tag>
  );
}
