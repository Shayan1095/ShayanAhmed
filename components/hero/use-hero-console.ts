"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroChannel, SiteSettings } from "@/lib/content/types";

export type ConsoleLine = { id: number; tag: string; text: string; time: string };
export type Channels = Record<HeroChannel, boolean>;

const START_MINUTES = 9 * 60 + 2;
const fmt = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/**
 * The hero slab's live strip: cycles illustrative events, filtered by the
 * SITE / ORDERS / LEADS channel tabs. `running` starts it (after the screen
 * boots) and pauses it while the hero is off screen.
 */
export function useHeroConsole(events: SiteSettings["heroCaptionEvents"], running: boolean, slow: boolean) {
  const first = events[0];
  const [channels, setChannels] = useState<Channels>({ site: true, orders: true, leads: true });
  // The first line is in the server HTML, so the strip reads correctly without JS.
  const [lines, setLines] = useState<ConsoleLine[]>(
    first ? [{ id: 0, tag: first.tag, text: first.text, time: fmt(START_MINUTES) }] : [],
  );
  const state = useRef({ idx: 1, minutes: START_MINUTES, id: 0, channels });

  const push = useCallback(() => {
    const s = state.current;
    const pool = events.filter((e) => s.channels[e.channel]);
    s.minutes += 3 + ((s.idx * 7) % 9);
    s.id += 1;
    const ev = pool.length
      ? pool[s.idx++ % pool.length]
      : { tag: "Sys", text: "All channels off. Turn one on." };
    const line = { id: s.id, tag: ev.tag, text: ev.text, time: fmt(s.minutes) };
    setLines((prev) => [...prev.slice(-1), line]);
  }, [events]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(push, slow ? 4000 : 2400);
    return () => window.clearInterval(id);
  }, [running, slow, push]);

  const toggle = useCallback(
    (ch: HeroChannel) => {
      setChannels((prev) => {
        const next = { ...prev, [ch]: !prev[ch] };
        state.current.channels = next;
        return next;
      });
      // Show the effect of the switch straight away.
      window.setTimeout(push, 0);
    },
    [push],
  );

  const on = (Object.keys(channels) as HeroChannel[]).filter((k) => channels[k]);
  const mode = on.length === 3 ? "All channels" : on.length ? on.join(" + ") : "Standby";
  const clock = lines[lines.length - 1]?.time ?? fmt(START_MINUTES);

  return { lines, channels, toggle, mode, clock };
}
