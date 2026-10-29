"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteSettings } from "@/lib/content/types";

type Demo = SiteSettings["heroDemo"];
export type RoutineLine = { id: number; agent: string; text: string };

export type OpsDemoState = {
  /** Index of the decision on screen. */
  index: number;
  /** waiting: needs the visitor. resolved: showing the outcome before the next one. */
  phase: "waiting" | "resolved";
  result: string | null;
  /** Routine items agents finished on their own (demo counter). */
  handled: number;
  /** Decisions the visitor made. */
  decided: number;
  log: RoutineLine[];
  /** The visitor has interacted at least once. */
  touched: boolean;
};

const ROUTINE_MS = 3400;
const NEXT_MS = 2600;
const HANDLED_START = 14;

/**
 * The hero's operations demo. Agents keep finishing routine work in the
 * background; decisions wait for the visitor. Nothing is decided for them.
 * `running` pauses the routine ticker (off screen, before the screen boots).
 */
export function useOpsDemo(demo: Demo, running: boolean) {
  const [state, setState] = useState<OpsDemoState>(() => ({
    index: 0,
    phase: "waiting",
    result: null,
    handled: HANDLED_START,
    decided: 0,
    // Two finished items are in the server HTML so the screen reads well before JS.
    log: demo.routine.slice(0, 2).map((r, i) => ({ id: i, ...r })),
    touched: false,
  }));
  const seq = useRef({ id: 2, routine: 2 });
  const nextTimer = useRef<number | undefined>(undefined);

  // Routine work ticks along while the hero is visible.
  useEffect(() => {
    if (!running || demo.routine.length === 0) return;
    const id = window.setInterval(() => {
      const s = seq.current;
      const r = demo.routine[s.routine++ % demo.routine.length];
      const line = { id: s.id++, ...r };
      setState((prev) => ({ ...prev, handled: prev.handled + 1, log: [...prev.log.slice(-1), line] }));
    }, ROUTINE_MS);
    return () => window.clearInterval(id);
  }, [running, demo.routine]);

  useEffect(() => () => window.clearTimeout(nextTimer.current), []);

  const decide = useCallback(
    (actionIndex: number) => {
      setState((prev) => {
        if (prev.phase !== "waiting") return prev;
        const action = demo.decisions[prev.index]?.actions[actionIndex];
        if (!action) return prev;
        return { ...prev, phase: "resolved", result: action.result, decided: prev.decided + 1, touched: true };
      });
      window.clearTimeout(nextTimer.current);
      nextTimer.current = window.setTimeout(() => {
        setState((prev) => ({
          ...prev,
          phase: "waiting",
          result: null,
          index: (prev.index + 1) % Math.max(1, demo.decisions.length),
        }));
      }, NEXT_MS);
    },
    [demo.decisions],
  );

  return { state, decision: demo.decisions[state.index], decide };
}
