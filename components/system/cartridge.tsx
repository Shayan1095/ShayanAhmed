"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { useFinePointer, useReducedMotion } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Screen, type ScreenHandle } from "./screen";
import { StatusBadge, type ProjectStatus } from "./status-badge";

type CartridgeProps = {
  title: string;
  /** Kind label, e.g. "Management system". */
  kind: string;
  status: ProjectStatus;
  summary: string;
  /** One fact shown on the mini screen when the cartridge is hovered. */
  fact: string;
  /** Screenshot or diagram. Without one, the slot stays a plain inset. */
  shot?: React.ReactNode;
  href?: string;
  className?: string;
};

// Tilt springs from React Bits Tilted Card (MIT, reactbits.dev).
const tiltSpring = { damping: 30, stiffness: 100, mass: 2 };
const AMP_X = 7;
const AMP_Y = 9;
const LIFT = -6;

/**
 * Archive project card: grip strip, label area, status badge. On desktop it
 * tilts toward the cursor, lifts, and its mini label screen boots with one fact.
 * Motion owns the body's transform; reveals and layout animation go on a wrapper.
 */
export function Cartridge({ title, kind, status, summary, fact, shot, href, className }: CartridgeProps) {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const tilt = fine && !reduce;
  const screen = useRef<ScreenHandle>(null);

  const rotateX = useSpring(useMotionValue(0), tiltSpring);
  const rotateY = useSpring(useMotionValue(0), tiltSpring);
  const y = useSpring(useMotionValue(0), tiltSpring);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!tilt) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rotateX.set(-py * AMP_X);
    rotateY.set(px * AMP_Y);
  };
  const onEnter = () => {
    if (tilt) y.set(LIFT);
    screen.current?.boot();
  };
  const onLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    y.set(0);
  };

  const body = (
    <motion.div
      style={{ rotateX, rotateY, y }}
      className={cn(
        "group/cart relative flex h-full flex-col rounded-[16px_16px_22px_22px] px-[18px] pb-5",
        "bg-[linear-gradient(180deg,var(--color-paper-hi),var(--color-paper)_50%,var(--color-paper-lo))] shadow-raised",
        "transition-shadow duration-300 hover:shadow-[var(--shadow-raised),0_40px_50px_-30px_rgb(17_17_17/.35)] [transform-style:preserve-3d]",
      )}
    >
      {/* grip strip */}
      <div
        aria-hidden="true"
        className="-mx-[18px] mb-4 h-[26px] rounded-t-[16px] bg-[repeating-linear-gradient(90deg,var(--color-paper-lo)_0_3px,var(--color-paper-hi)_3px_7px)] shadow-[inset_0_-1px_0_var(--color-paper-edge)]"
      />
      <div className="flex flex-1 flex-col gap-2.5 rounded-[10px] bg-paper-hi p-4 shadow-[inset_0_0_0_1px_var(--color-paper-edge)]">
        <div className="inset-track relative h-[126px] overflow-hidden rounded-lg">
          {shot}
          <Screen
            ref={screen}
            bootOn="manual"
            className={cn(
              "absolute inset-0 flex items-end rounded-lg px-3.5 py-3 font-mono text-[11.5px] tracking-[0.02em]",
              "opacity-0 transition-opacity duration-200 group-hover/cart:opacity-100 [@media(hover:none)]:opacity-100",
              // On touch, the fact sits in a strip at the bottom instead of covering the shot.
              "[@media(hover:none)]:top-auto [@media(hover:none)]:rounded-t-none",
            )}
          >
            <span className="relative z-[3]">
              <span aria-hidden="true" className="mr-2 text-copper">
                ›
              </span>
              {fact}
            </span>
          </Screen>
        </div>
        <div className="flex items-center justify-between gap-2.5">
          <Label>{kind}</Label>
          <StatusBadge status={status} />
        </div>
        <h3 className="font-display text-xl font-extrabold uppercase leading-[1.1] tracking-[-0.01em] [font-variation-settings:'wdth'_110]">
          {href ? (
            <Link href={href} className="after:absolute after:inset-0 after:content-['']">
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
        <p className="text-sm text-muted">{summary}</p>
      </div>
    </motion.div>
  );

  return (
    <div
      className={cn("h-full [perspective:900px]", className)}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      {body}
    </div>
  );
}
