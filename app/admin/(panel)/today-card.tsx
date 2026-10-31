"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowRight, Sun } from "lucide-react";
import { addDays, dayKey, dueKey, weekStart } from "@/lib/admin/dates";
import type { PlannerConfig, Task } from "@/lib/admin/types";

const subscribe = () => () => {};

/** Today's plan in the viewer's time zone: overdue, due today, and the week's goal. */
export function TodayCard({ tasks, config }: { tasks: Task[]; config: PlannerConfig }) {
  const client = useSyncExternalStore(subscribe, () => true, () => false);
  const done = new Set(config.columns.filter((c) => c.done).map((c) => c.id));
  const today = client ? dayKey() : "";
  const open = tasks.filter((t) => !done.has(t.columnId));
  const overdue = client ? open.filter((t) => (dueKey(t.due) ?? "9999") < today) : [];
  const dueToday = client ? open.filter((t) => dueKey(t.due) === today) : [];
  const monday = client ? weekStart(new Date()) : "";
  const doneWeek = client
    ? tasks.filter((t) => t.completedAt && dayKey(new Date(t.completedAt)) >= monday && dayKey(new Date(t.completedAt)) <= addDays(monday, 6)).length
    : 0;
  const focus = [...overdue, ...dueToday].slice(0, 4);
  const pct = Math.min(100, (doneWeek / config.weeklyGoal) * 100);

  return (
    <section className="flex flex-col surface rounded-2xl p-5">
      <h2 className="mb-3 flex items-center gap-2 text-[14px] font-semibold">
        <Sun className="size-4 text-copper-ink" aria-hidden="true" /> Today
      </h2>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <p>
          <span className="font-display text-[34px] font-extrabold leading-none">{dueToday.length}</span>
          <span className="ml-1.5 text-[13px] text-muted">due today</span>
        </p>
        <p>
          <span className={overdue.length ? "font-display text-[34px] font-extrabold leading-none text-alert" : "font-display text-[34px] font-extrabold leading-none"}>
            {overdue.length}
          </span>
          <span className="ml-1.5 text-[13px] text-muted">overdue</span>
        </p>
      </div>
      {focus.length > 0 && (
        <ul className="mt-3 divide-y divide-paper-edge/50">
          {focus.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
              <span className="truncate">{t.title}</span>
              <span className={(dueKey(t.due) ?? "") < today ? "shrink-0 text-[12px] font-semibold text-alert" : "shrink-0 text-[12px] text-copper-ink"}>
                {(dueKey(t.due) ?? "") < today ? "Overdue" : "Today"}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[12.5px] text-muted">
          <span>This week</span>
          <span className="font-mono">
            {doneWeek}/{config.weeklyGoal}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Weekly goal"
          aria-valuemin={0}
          aria-valuemax={config.weeklyGoal}
          aria-valuenow={doneWeek}
          className="h-2 overflow-hidden rounded-full bg-paper-edge/40"
        >
          <div className="h-full rounded-full bg-copper transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <Link href="/admin/planner?view=today" className="mt-auto inline-flex items-center gap-1 pt-4 text-[13.5px] font-semibold hover:underline">
        Open planner <ArrowRight className="size-3.5" />
      </Link>
    </section>
  );
}
