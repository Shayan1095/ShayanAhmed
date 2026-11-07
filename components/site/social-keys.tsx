"use client";

import * as m from "motion/react-m";
import { useMotionValue, useReducedMotion, useSpring } from "motion/react";
import type { SocialLink } from "@/lib/content/socials";
import { cn } from "@/lib/utils";

/** Loose cluster spots (desktop), as fractions of the cluster box: never a grid, never overlapping. */
const SPOTS = [
  [0.06, 0.1], [0.36, 0.02], [0.66, 0.12], [0.2, 0.4], [0.5, 0.36], [0.8, 0.44],
  [0.04, 0.7], [0.34, 0.68], [0.62, 0.72], [0.88, 0.76], [0.18, 0.96], [0.5, 0.98],
] as const;

/**
 * "Find me elsewhere": every way to reach Shayan as a copper-legend keycap,
 * in the SA key's style. Desktop: the keys float in a loose cluster; hover
 * pulls a key toward the cursor and slides out its name; a click presses it
 * like a real key. Phones: a neat grid that bobs very slightly.
 * Real links with names for screen readers; still with reduced motion.
 */
export function SocialKeys({ links }: { links: SocialLink[] }) {
  if (links.length === 0) return null;
  return (
    <nav aria-label="Find me elsewhere">
      {/* Desktop: the floating cluster. */}
      <ul className="relative hidden h-[300px] w-[400px] min-[900px]:block">
        {links.slice(0, SPOTS.length).map((l, i) => (
          <li
            key={l.key}
            className="absolute"
            style={{ left: `${SPOTS[i][0] * 82}%`, top: `${SPOTS[i][1] * 76}%` }}
          >
            <Key link={l} index={i} magnetic />
          </li>
        ))}
      </ul>
      {/* Phones and tablets: a grid. */}
      <ul className="flex flex-wrap gap-3 min-[900px]:hidden">
        {links.map((l, i) => (
          <li key={l.key}>
            <Key link={l} index={i} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Key({ link, index, magnetic = false }: { link: SocialLink; index: number; magnetic?: boolean }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 18 });
  const y = useSpring(my, { stiffness: 260, damping: 18 });

  const pull = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (!magnetic || reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - (r.left + r.width / 2)) / r.width) * 14);
    my.set(((e.clientY - (r.top + r.height / 2)) / r.height) * 14);
  };
  const release = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    // The float lives on a wrapper so it never fights the magnetic pull.
    <span
      className={cn("social-key-float block", magnetic ? "" : "social-key-bob")}
      style={{ "--float-dur": `${6 + (index % 4) * 0.9}s`, "--float-delay": `${-index * 0.7}s` } as React.CSSProperties}
    >
      <m.a
        href={link.href}
        {...(link.external ? { target: "_blank", rel: "noopener noreferrer me" } : {})}
        aria-label={link.external ? `${link.label} (opens in a new tab)` : link.label}
        onPointerMove={pull}
        onPointerLeave={release}
        style={{ x, y }}
        whileHover={reduce ? undefined : { y: -4 }}
        whileTap={reduce ? undefined : { scale: 0.94, y: 3 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        className="group/key relative grid size-16 place-items-center rounded-[16px] bg-[linear-gradient(180deg,#2d2620,#1a1511)] font-display text-[22px] font-black tracking-[-0.02em] text-copper shadow-[inset_0_1px_0_rgb(255_255_255/.1),inset_0_-5px_0_#0d0b09,0_5px_0_#070605,0_14px_22px_-10px_rgb(0_0_0/.8),0_0_0_1px_rgb(232_178_122/.16)] outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink min-[900px]:size-[68px]"
      >
        <span aria-hidden="true" className="-mt-1">
          {link.legend}
        </span>
        {/* Its name slides out on hover or focus (desktop). */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-full mt-3 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full bg-paper px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink opacity-0 transition-[opacity,translate] duration-200 group-hover/key:translate-y-0 group-hover/key:opacity-100 group-focus-visible/key:translate-y-0 group-focus-visible/key:opacity-100 max-[899px]:hidden"
        >
          {link.label} ↗
        </span>
      </m.a>
    </span>
  );
}
