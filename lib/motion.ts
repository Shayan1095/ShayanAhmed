/**
 * Shared motion grammar (DESIGN.md §6). Every timing on the site comes from here.
 */
export const motionGrammar = {
  /** GSAP entrance ease: the site's signature curve (CustomEase, lib/gsap.ts). */
  ease: "sa.out",
  /** GSAP toggle and layout ease. */
  easeToggle: "sa.inOut",
  /** Numbers and keys landing: a slight overshoot, then rest. */
  easeSettle: "sa.settle",
  heading: { yPercent: 110, duration: 1, stagger: 0.08, start: "top 85%" },
  block: { y: 40, duration: 0.9, start: "top 90%" },
  scrub: 0.8,
  /** Max pinned length, in viewport heights. */
  maxPin: 1.6,
} as const;

/** Motion (motion/react) spring for presses, keys and levers. */
export const pressSpring = { type: "spring", stiffness: 400, damping: 30 } as const;

/** CSS cubic-bezier of expo.out, for Motion tweens. */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;
