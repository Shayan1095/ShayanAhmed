"use client";

import { useState, useTransition } from "react";
import { Check, ListChecks, Pencil, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { dueKey, dueLabel } from "@/lib/admin/dates";
import type { PlannerDay, Task } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { saveDayPlan } from "./actions";

const rank = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 } as const;

/**
 * The day's three most important tasks. Morning: pick them (overdue and
 * high-priority work is offered first). During the day: tick them off.
 */
export function TopThree({
  today,
  day,
  tasks,
  doneCols,
  onDay,
  onToggle,
}: {
  today: string;
  day: PlannerDay;
  tasks: Task[];
  doneCols: Set<string>;
  onDay: (d: PlannerDay) => void;
  onToggle: (t: Task, done: boolean) => void;
}) {
  const chosen = day.top3.map((id) => tasks.find((t) => t.id === id)).filter((t): t is Task => Boolean(t));
  const [picking, setPicking] = useState(chosen.length === 0);
  const [pick, setPick] = useState<string[]>(day.top3);
  const [pending, start] = useTransition();

  const candidates = tasks
    .filter((t) => !doneCols.has(t.columnId))
    .sort((a, b) => {
      const da = dueKey(a.due) ?? "9999";
      const db = dueKey(b.due) ?? "9999";
      if ((da <= today) !== (db <= today)) return da <= today ? -1 : 1;
      if (rank[a.priority] !== rank[b.priority]) return rank[a.priority] - rank[b.priority];
      return da.localeCompare(db);
    })
    .slice(0, 12);

  const lockIn = () =>
    start(async () => {
      const res = await saveDayPlan(today, { top3: pick });
      if (!res.ok || !res.data) return void toast.error(res.ok ? "Couldn't save" : res.error);
      onDay(res.data);
      setPicking(false);
      toast.success(pick.length ? "Top 3 locked in. Go." : "Top 3 cleared");
    });

  if (picking)
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[13.5px] text-muted">Pick up to three tasks that would make today a win. Overdue and high-priority work is listed first.</p>
        {candidates.length === 0 ? (
          <p className="groove !rounded-2xl px-4 py-6 text-center text-[13.5px] text-muted">No open tasks. Add some on the board, or press N there.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {candidates.map((t) => {
              const on = pick.includes(t.id);
              const full = pick.length >= 3 && !on;
              const due = dueLabel(t.due, today);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    disabled={full}
                    onClick={() => setPick((p) => (on ? p.filter((x) => x !== t.id) : [...p, t.id]))}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                      on ? "keycap" : "hover:bg-paper-lo/50",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-md font-mono text-[11px] font-bold",
                        on ? "lit text-[#1a1208]" : "groove !rounded-md",
                      )}
                    >
                      {on ? pick.indexOf(t.id) + 1 : ""}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{t.title}</span>
                    {due && (
                      <span className={cn("shrink-0 text-[11.5px] font-semibold", due.tone === "overdue" ? "text-alert" : due.tone === "today" ? "text-copper-ink" : "text-muted")}>
                        {due.text}
                      </span>
                    )}
                    {t.priority !== "none" && <span className="shrink-0 font-mono text-[10px] uppercase text-muted">{t.priority}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">{pick.length}/3 picked</span>
          <div className="flex gap-2">
            {chosen.length > 0 && (
              <Button variant="outline" onClick={() => setPicking(false)}>
                Cancel
              </Button>
            )}
            <Button onClick={lockIn} disabled={pending}>
              <Sparkles /> Lock in
            </Button>
          </div>
        </div>
      </div>
    );

  const done = chosen.filter((t) => doneCols.has(t.columnId)).length;
  const all = chosen.length > 0 && done === chosen.length;

  return (
    <div className="flex flex-1 flex-col gap-3">
      <ol className="flex flex-col gap-2.5">
        {chosen.map((t, i) => {
          const isDone = doneCols.has(t.columnId);
          return (
            <li key={t.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isDone}
                onClick={() => onToggle(t, !isDone)}
                className={cn(
                  "group flex w-full cursor-pointer items-center gap-4 rounded-2xl p-3 text-left transition-[transform,box-shadow] active:translate-y-px",
                  isDone ? "groove !rounded-2xl" : "keycap",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl font-mono text-[16px] font-bold transition-colors",
                    isDone ? "lit text-[#1a1208]" : "screen text-[var(--screen-amber)]",
                  )}
                >
                  <span className="relative z-[1]">{isDone ? <Check className="size-5" strokeWidth={3} /> : i + 1}</span>
                </span>
                <span className={cn("min-w-0 flex-1 text-[15px] font-semibold leading-snug", isDone && "text-muted line-through decoration-copper/70 decoration-2")}>
                  {t.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {all ? (
        <p className="screen flex items-center gap-3 px-4 py-3">
          <ListChecks className="relative z-[1] size-5 text-[var(--screen-amber)]" aria-hidden="true" />
          <span className="relative z-[1] font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--screen-amber)]">Top 3 done. That&apos;s a winning day.</span>
        </p>
      ) : (
        <p className="text-[12.5px] text-muted">
          {done}/{chosen.length} done. Start with number 1 and protect it with a focus session.
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          setPick(day.top3);
          setPicking(true);
        }}
        className="mt-auto inline-flex w-fit cursor-pointer items-center gap-1.5 text-[12.5px] font-semibold text-muted hover:text-ink"
      >
        <Pencil className="size-3.5" aria-hidden="true" /> Change top 3
      </button>
    </div>
  );
}
