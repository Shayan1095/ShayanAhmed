import type { HeroChannel } from "@/lib/content/types";
import type { Channels, ConsoleLine } from "../use-hero-console";

/** Slab dimensions in scene units (DESIGN.md §8 Hero object). */
export const DEV = {
  W: 3.6, // frame width
  H: 2.3, // frame height
  R: 0.16, // frame corner radius
  SW: 3.38, // screen width
  SH: 2.08, // screen height
  SR: 0.1, // screen corner radius
  STRIP: 0.6, // dark live strip height (29% of the screen, matching the HTML slab)
} as const;

/** Assembled z offsets and teardown travel. */
export const LAYERS = { glass: 0, board: -0.12, core: -0.26, travel: 1.3 } as const;

/** Camera field of view and its visible-size factor (2·tan(fov/2)). */
export const FOV = 30;
export const K = 2 * Math.tan(((FOV / 2) * Math.PI) / 180);

/** Where the slab sits in the 2D layout (centre as viewport fraction), so 3D lines up with it. */
export const ANCHOR = { x: 0.71, y: 0.53 } as const;

/** Base tilt at rest (radians), matching the HTML slab's CSS tilt. */
export const BASE_TILT = { x: 0.087, y: -0.244 } as const;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/** Smoothstep between a and b. */
export const ss = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Mutable state shared between the React/GSAP side and the render loop.
 * GSAP writes progress and boot values; the scene reads them every frame.
 */
export type HeroState = {
  /** Scroll progress through the pinned hero, smoothed by GSAP scrub. 0..1 */
  p: number;
  /** Entrance values. */
  boot: { rise: number; led: number; screen: number };
  /** Live strip data from useHeroConsole. */
  live: { lines: ConsoleLine[]; channels: Channels; mode: string; clock: string };
  onToggle: (ch: HeroChannel) => void;
  /** Label cards positioned by the scene (outer wrappers). */
  cards: (HTMLElement | null)[];
};

export function createHeroState(): HeroState {
  return {
    p: 0,
    boot: { rise: 1, led: 1, screen: 1 },
    live: { lines: [], channels: { site: true, orders: true, leads: true }, mode: "All channels", clock: "09:02" },
    onToggle: () => {},
    cards: [],
  };
}

/** Is WebGL available? */
export function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
