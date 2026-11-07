"use client";

import { useRef } from "react";
import { gsap, MQ, SplitText, useGSAP } from "@/lib/gsap";
import { motionGrammar, tokens } from "@/lib/motion";

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
              duration: Math.min(duration, tokens().reveal + 0.2),
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
  as?: RevealTag | "article" | "li" | "section" | "ul" | "ol";
  start?: string;
  delay?: number;
  /** Reveal the direct children one after another instead of the block. */
  stagger?: boolean;
};

/**
 * The shared content reveal (motion spec): fade + rise by --travel (32px,
 * 18px on phones), once. The hidden start state is set by JS when it runs,
 * so without JS everything is simply there. With `stagger`, children follow
 * each other 60ms apart (40ms on phones), and anything past the 6th (4th on
 * phones) arrives with the last, so long lists never keep content waiting.
 * Never wrap a Screen or a Motion-animated element directly.
 */
export function Rise({ as = "div", start = motionGrammar.block.start, delay = 0, stagger = false, children, ...props }: RiseProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap.matchMedia().add(MQ.motion, () => {
        const t = tokens();
        const targets = stagger ? Array.from(el.children) : el;
        gsap.from(targets, {
          y: t.travel,
          opacity: 0,
          duration: t.reveal,
          delay,
          ease: motionGrammar.ease,
          stagger: stagger ? (i: number) => Math.min(i, t.maxStagger - 1) * t.stagger : 0,
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
