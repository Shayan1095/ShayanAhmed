"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { PlannerDay, Task } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { logFocus } from "./actions";

type Saved = { endAt: number | null; left: number | null; length: number; taskId: string };
const KEY = "sa-focus";

function load(): Saved | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null") as Saved | null;
    return v && typeof v.length === "number" ? v : null;
  } catch {
    return null;
  }
}
function persist(v: Saved | null) {
  try {
    if (v) localStorage.setItem(KEY, JSON.stringify(v));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the timer still runs on this page */
  }
}

/** Two soft tones when a session ends (no audio file needed). */
function chime() {
  try {
    const ctx = new AudioContext();
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.connect(g).connect(ctx.destination);
      const t = ctx.currentTime + i * 0.22;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.start(t);
      o.stop(t + 0.55);
    });
  } catch {
    /* no audio: the toast still says it */
  }
}

const lengths = [15, 25, 45, 60];

/**
 * Pomodoro-style focus timer on a recessed screen. It keeps running if you
 * leave the page (the end time is saved in this browser) and logs the
 * minutes to today when a session finishes.
 */
export function FocusTimer({
  today,
  length,
  sessions,
  tasks,
  onDay,
  onLength,
}: {
  today: string;
  length: number;
  sessions: number;
  tasks: Task[];
  onDay: (d: PlannerDay) => void;
  onLength: (n: number) => void;
}) {
  const [saved, setSaved] = useState<Saved | null>(() => load());
  const [now, setNow] = useState(() => Date.now());
  const logged = useRef(false);

  const mins = saved?.length ?? length;
  const total = mins * 60_000;
  const running = Boolean(saved?.endAt);
  const left = saved ? (saved.endAt ? Math.max(0, saved.endAt - now) : (saved.left ?? total)) : total;
  const progress = 1 - left / total;
  const taskId = saved?.taskId ?? "";

  const update = (v: Saved | null) => {
    setSaved(v);
    persist(v);
  };

  // Tick while running.
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [running]);

  // Session finished: log it once, chime, and reset.
  useEffect(() => {
    if (!running || left > 0 || logged.current) return;
    logged.current = true;
    chime();
    const task = tasks.find((t) => t.id === taskId);
    logFocus(today, mins).then((res) => {
      if (res.ok && res.data) onDay(res.data);
      toast.success(`+5 · ${mins} min focused`, { description: task ? `On "${task.title}". Take a 5-minute break.` : "Take a 5-minute break." });
      update(null);
      logged.current = false;
    });
  });

  // Tab title shows the countdown while running.
  useEffect(() => {
    if (!running) return;
    const prev = document.title;
    document.title = `${fmt(left)} · Focus`;
    return () => {
      document.title = prev;
    };
  }, [running, left]);

  const startOrPause = () => {
    if (running) update({ ...saved!, endAt: null, left });
    else update({ length: mins, taskId, left: null, endAt: Date.now() + left });
    setNow(Date.now());
  };

  const r = 70;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="screen grid place-items-center px-4 py-5">
        <div className="relative z-[1] grid place-items-center">
          <svg viewBox="0 0 160 160" className="size-44 -rotate-90" aria-hidden="true">
            <circle cx="80" cy="80" r={r} fill="none" strokeWidth="6" stroke="rgb(255 255 255 / 0.07)" />
            <circle
              cx="80"
              cy="80"
              r={r}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              stroke="#e09a4f"
              strokeDasharray={`${progress * c} ${c}`}
              style={{ filter: "drop-shadow(0 0 6px rgb(224 154 79 / 0.8))", transition: "stroke-dasharray 0.5s linear" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span
              role="timer"
              aria-live="off"
              aria-label={`${Math.ceil(left / 60_000)} minutes left`}
              className="font-mono text-[40px] font-semibold leading-none tabular-nums text-[var(--screen-amber)] [text-shadow:0_0_16px_rgb(224_154_79/0.6)]"
            >
              {fmt(left)}
            </span>
            <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--screen-dim)]">
              {running ? "Focusing" : saved ? "Paused" : "Ready"}
            </span>
          </div>
        </div>
        <div role="img" className="relative z-[1] mt-2 flex gap-1.5" aria-label={`${sessions} focus sessions today`}>
          {Array.from({ length: Math.max(4, sessions) }, (_, i) => (
            <span key={i} className={cn("size-2 rounded-full", i < sessions ? "bg-[var(--led-on)] shadow-[0_0_6px_rgb(224_154_79/0.8)]" : "bg-white/10")} />
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5 text-[12.5px]">
        <span className="engraved font-mono text-[10.5px] uppercase tracking-[0.12em]">Working on</span>
        <select
          value={taskId}
          onChange={(e) => update({ length: mins, endAt: saved?.endAt ?? null, left: saved?.left ?? null, taskId: e.target.value })}
          className="groove h-10 !rounded-xl bg-transparent px-3 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-copper/60"
        >
          <option value="">Anything (no task)</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={startOrPause}
          className="lit inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold text-[#1a1208] transition-transform active:translate-y-px"
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {running ? "Pause" : saved ? "Resume" : "Start focus"}
        </button>
        <button
          type="button"
          aria-label="Reset timer"
          onClick={() => update(null)}
          className="keycap grid size-11 cursor-pointer place-items-center active:translate-y-px"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>
      <div role="group" aria-label="Session length" className="flex gap-1.5">
        {lengths.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={mins === n}
            disabled={Boolean(saved)}
            onClick={() => onLength(n)}
            className="flex-1 cursor-pointer rounded-lg py-1.5 font-mono text-[11.5px] text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:bg-ink aria-pressed:text-paper"
          >
            {n}m
          </button>
        ))}
      </div>
    </div>
  );
}

function fmt(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
