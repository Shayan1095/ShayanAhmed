"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowRight, Flame, Target, Trophy } from "lucide-react";
import { addDays, dayKey, dueKey } from "@/lib/admin/dates";
import { dayStats, level, levelTitle, streaks } from "@/lib/admin/ritual";
import type { PlannerConfig, PlannerDay, Task } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { InstrumentCard } from "./dashboard/charts";

const subscribe = () => () => {};

/**
 * Today, from the dashboard: the streak to protect, today's points against the
 * daily goal, your level, and what's due or overdue. All in the viewer's time zone.
 */
export function TodayCard({ tasks, config, days }: { tasks: Task[]; config: PlannerConfig; days: PlannerDay[] }) {
  const client = useSyncExternalStore(subscribe, () => true, () => false);
  if (!client)
    return (
      <InstrumentCard title="Today">
        <div aria-busy="true" className="h-40 animate-pulse rounded-2xl bg-paper-edge/25" />
      </InstrumentCard>
    );

  const today = dayKey();
  const done = new Set(config.columns.filter((c) => c.done).map((c) => c.id));
  const stats = dayStats(tasks, days, config, addDays(today, -125), today);
  const s = streaks(stats, config.dailyGoal, today);
  const t = stats.get(today)!;
  const lv = level([...stats.values()].reduce((a, b) => a + b.points, 0));
  const open = tasks.filter((x) => !done.has(x.columnId));
  const overdue = open.filter((x) => (dueKey(x.due) ?? "9999") < today);
  const dueToday = open.filter((x) => dueKey(x.due) === today);
  const plan = days.find((d) => d.date === today);
  const left = Math.max(0, config.dailyGoal - t.done);

  return (
    <InstrumentCard title="Today" meta={s.todayMet ? "Goal hit" : `${left} to go`}>
      <div className="grid grid-cols-3 gap-2">
        <Readout
          icon={<Flame className={cn("size-3.5", s.current ? "text-[var(--screen-amber)]" : "text-[var(--screen-dim)]")} aria-hidden="true" />}
          label="Streak"
          value={String(s.current)}
          foot={s.current === 1 ? "day" : "days"}
          glow={s.todayMet}
        />
        <Readout
          icon={<Target className="size-3.5 text-[var(--screen-amber)]" aria-hidden="true" />}
          label="Points"
          value={String(t.points)}
          foot={`${t.done}/${config.dailyGoal} tasks`}
          meter={Math.min(1, t.done / config.dailyGoal)}
        />
        <Readout
          icon={<Trophy className="size-3.5 text-[var(--screen-amber)]" aria-hidden="true" />}
          label={`Lvl ${lv.level}`}
          value={levelTitle(lv.level)}
          foot={`${lv.into}/${lv.need} xp`}
          meter={lv.progress}
          small
        />
      </div>

      <p className="mt-3 text-[13px] leading-snug">
        {plan?.intention ? (
          <>
            <span className="engraved font-mono text-[10px] uppercase tracking-[0.12em]">One thing · </span>
            <span className="font-semibold">{plan.intention}</span>
          </>
        ) : (
          <span className="text-muted">
            {s.current > 0 && !s.todayMet
              ? `Finish ${left} more ${left === 1 ? "task" : "tasks"} today to keep your ${s.current}-day streak.`
              : "No plan yet. Set your one thing and top 3 to start the day."}
          </span>
        )}
      </p>

      {(overdue.length > 0 || dueToday.length > 0) && (
        <ul className="mt-2 divide-y divide-paper-edge/50">
          {[...overdue, ...dueToday].slice(0, 3).map((x) => {
            const late = (dueKey(x.due) ?? "") < today;
            return (
              <li key={x.id} className="flex items-center justify-between gap-3 py-1.5 text-[13px]">
                <span className="truncate">{x.title}</span>
                <span className={cn("shrink-0 text-[11.5px] font-semibold", late ? "text-alert" : "text-copper-ink")}>{late ? "Overdue" : "Today"}</span>
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/admin/planner/today" className="mt-auto inline-flex items-center gap-1 pt-3 text-[13.5px] font-semibold hover:underline">
        {plan?.top3.length ? "Open today" : "Plan today"} <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </InstrumentCard>
  );
}

function Readout({
  icon,
  label,
  value,
  foot,
  meter,
  glow,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  foot: string;
  meter?: number;
  glow?: boolean;
  small?: boolean;
}) {
  return (
    <div className={cn("screen flex flex-col gap-1.5 p-2.5", glow && "shadow-[inset_0_2px_8px_rgb(0_0_0/0.75),0_0_20px_-4px_rgb(224_154_79/0.6)]")}>
      <p className="relative z-[1] flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--screen-dim)]">
        {icon}
        {label}
      </p>
      <p
        className={cn(
          "relative z-[1] font-mono font-semibold text-[var(--screen-amber)] [text-shadow:0_0_12px_rgb(224_154_79/0.55)]",
          small ? "text-[12.5px] leading-tight" : "truncate text-[28px] leading-none",
        )}
      >
        {value}
      </p>
      {meter !== undefined && (
        <div className="relative z-[1] h-1 overflow-hidden rounded-full bg-white/8">
          <div className="lit h-full rounded-full" style={{ width: `${Math.round(meter * 100)}%` }} />
        </div>
      )}
      <p className="relative z-[1] mt-auto font-mono text-[9.5px] uppercase tracking-[0.06em] text-[var(--screen-dim)]">{foot}</p>
    </div>
  );
}
