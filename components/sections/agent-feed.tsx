"use client";

import Link from "next/link";
import * as m from "motion/react-m";
import { AnimatePresence, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { UiFragmentData } from "@/lib/content/types";
import { Label, Stamp, UiFragment } from "@/components/system";
import { motion as tokens } from "@/lib/motion";

type Done = "approved" | "skipped";

/**
 * "This morning, from the agents" (build brief, Phase 5): a playable queue of
 * the project's example agent items (labelled as example data). Approve
 * stamps the card, folds it away and slides the next one in; Skip slides it
 * out without a stamp. A counter shows what is left; when the queue is empty,
 * one line sums up what you did, with the case study and Replay. Local state
 * only. Fully keyboard operable (focus moves to the next card's first action),
 * and every change is announced in a live region.
 */
export function AgentFeed({
  items,
  caseHref,
  caseTitle,
}: {
  items: UiFragmentData[];
  caseHref?: string;
  caseTitle?: string;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<Done[]>([]);
  const [stamping, setStamping] = useState(false);
  const [last, setLast] = useState<Done>("approved");
  const [announce, setAnnounce] = useState("");
  const first = useRef<HTMLButtonElement>(null);
  const replay = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);

  const current = items[index];
  const left = items.length - index;

  // After an action, keyboard focus follows: the next card's Approve, or Replay.
  useEffect(() => {
    if (!moved.current) return;
    (current ? first.current : replay.current)?.focus({ preventScroll: true });
  }, [index, current]);

  if (items.length === 0) return null;

  const next = (result: Done) => {
    moved.current = true;
    setLast(result);
    setDone((d) => [...d, result]);
    setIndex((i) => i + 1);
  };

  const approve = () => {
    if (!current || stamping) return;
    setStamping(true);
    setAnnounce(`Approved: ${current.text}. ${left - 1} left.`);
    // The stamp lands, then the card folds away.
    window.setTimeout(
      () => {
        setStamping(false);
        next("approved");
      },
      reduce ? 0 : 520,
    );
  };

  const skip = () => {
    if (!current || stamping) return;
    setAnnounce(`Skipped: ${current.text}. ${left - 1} left.`);
    next("skipped");
  };

  const restart = () => {
    moved.current = true;
    setDone([]);
    setIndex(0);
    setAnnounce(`Queue restarted. ${items.length} items.`);
  };

  const approved = done.filter((d) => d === "approved").length;
  const skipped = done.length - approved;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <Label accent>This morning, from the agents</Label>
        <span className="flex items-center gap-3">
          <Label className="text-muted-ink">Example data</Label>
          {current && (
            <span aria-hidden="true" className="font-mono text-[12px] tabular-nums text-copper">
              {left} left
            </span>
          )}
        </span>
      </div>

      {/* Announcements for screen readers (each action and the summary). */}
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>

      <div className="relative min-h-[150px]">
        <AnimatePresence mode="popLayout" initial={false} custom={last}>
          {current ? (
            <m.div
              key={index}
              custom={last}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.21, delay: 0.12, ease: [...tokens.ease.out] } }}
              // Approved: shrinks away; skipped: slides out to the left (exits are faster than entrances).
              variants={{
                exit: (r: Done) =>
                  r === "skipped"
                    ? { opacity: 0, x: -60, pointerEvents: "none", transition: { duration: 0.15, ease: [...tokens.ease.in] } }
                    : { opacity: 0, scale: 0.96, pointerEvents: "none", transition: { duration: 0.15, ease: [...tokens.ease.in] } },
              }}
              exit="exit"
              className="flex flex-col gap-3"
            >
              <div className="relative">
                <UiFragment tag={current.tag} text={current.text} live={index === 0} className="w-full" />
                {/* The receipt's stamp lands on approve. */}
                <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <Stamp kind="approved" show={stamping} />
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  ref={first}
                  type="button"
                  onClick={approve}
                  aria-label={`Approve: ${current.text}`}
                  className="press inline-flex min-h-11 items-center rounded-full bg-copper px-5 text-[15px] font-bold text-[#140d08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={skip}
                  aria-label={`Skip: ${current.text}`}
                  className="press inline-flex min-h-11 items-center rounded-full px-5 text-[15px] font-semibold text-paper shadow-[inset_0_0_0_1px_var(--color-ink-3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper"
                >
                  Skip
                </button>
              </div>
            </m.div>
          ) : (
            <m.div
              key="done"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.21, delay: 0.12, ease: [...tokens.ease.out] } }}
              className="flex flex-col gap-4 rounded-[14px] bg-[linear-gradient(180deg,#26231f,#171614)] p-5 shadow-[inset_0_1px_0_rgb(255_255_255/.1)]"
            >
              <p className="m-0 text-[16px]">
                Queue clear: {approved} approved, {skipped} skipped.
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {caseHref && (
                  <Link
                    href={caseHref}
                    transitionTypes={["nav-forward"]}
                    className="inline-flex min-h-11 items-center gap-2 text-[16px] font-semibold text-copper"
                  >
                    See the {caseTitle ?? "case study"} build <span aria-hidden="true">→</span>
                  </Link>
                )}
                <button
                  ref={replay}
                  type="button"
                  onClick={restart}
                  className="press inline-flex min-h-11 items-center rounded-full px-5 text-[15px] font-semibold text-paper shadow-[inset_0_0_0_1px_var(--color-ink-3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper"
                >
                  Replay
                </button>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
