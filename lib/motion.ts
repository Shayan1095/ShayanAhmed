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
  heading: { yPercent: 110, duration: 0.9, stagger: 0.08, start: "top 85%" },
  block: { y: 32, duration: 0.7, start: "top 90%" },
  scrub: 0.8,
  /** Max pinned length, in viewport heights. */
  maxPin: 1.6,
} as const;

/** Motion (motion/react) spring for presses, keys and levers. */
export const pressSpring = { type: "spring", stiffness: 400, damping: 30 } as const;

/** CSS cubic-bezier of expo.out, for Motion tweens. */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

/**
 * Motion tokens (motion & mobile spec), mirroring the CSS variables in
 * globals.css. Seconds, for GSAP; Motion takes the same numbers.
 */
export const motionTokens = {
  desktop: { micro: 0.15, ui: 0.26, reveal: 0.7, hero: 1.1, travel: 32, stagger: 0.06, maxStagger: 6 },
  mobile: { micro: 0.12, ui: 0.22, reveal: 0.55, hero: 0.9, travel: 18, stagger: 0.04, maxStagger: 4 },
  easeOut: [0.16, 1, 0.3, 1],
  easeInOut: [0.65, 0, 0.35, 1],
} as const;

/**
 * Build brief motion tokens (PORTFOLIO_BUILD_BRIEF.md section 3), mirroring the
 * CSS variables. Durations in seconds for GSAP and Motion; easings as cubic
 * Bezier arrays (Motion) and CSS strings.
 */
export const motion = {
  dur: { press: 0.12, fast: 0.2, base: 0.4, slow: 0.8 },
  ease: {
    out: [0.16, 1, 0.3, 1] as const,
    in: [0.7, 0, 0.84, 0] as const,
    inOut: [0.65, 0, 0.35, 1] as const,
  },
  css: {
    out: "cubic-bezier(0.16, 1, 0.3, 1)",
    in: "cubic-bezier(0.7, 0, 0.84, 0)",
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  },
} as const;

/** The token set for this viewport (phones: under 768px). */
export function tokens() {
  const phone = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  return phone ? motionTokens.mobile : motionTokens.desktop;
}
