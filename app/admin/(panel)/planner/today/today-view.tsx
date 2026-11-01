"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, useTransition } from "react";
import { ArrowRight, Flame, Minus, Plus, Target, Trophy } from "lucide-react";
import { toast } from "sonner";
import { notifyShell } from "@/components/admin/shell";
import { addDays, dayKey, dueKey } from "@/lib/admin/dates";
import { dayStats, level, levelTitle, POINTS, streaks } from "@/lib/admin/ritual";
import type { PlannerConfig, PlannerDay, Task } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { InstrumentCard } from "../../dashboard/charts";
import { updateTask } from "../actions";
import { saveDayPlan, saveRitualSettings } from "./actions";
import { DueList } from "./due-list";
import { FocusTimer } from "./focus-timer";
import { Habits } from "./habits";
import { Heatmap } from "./heatmap";
import { Review } from "./review";
import { TopThree } from "./top-three";

const subscribe = () => () => {};

/** Everything on the Today page shares this state: tasks, days and the ritual settings. */
export function TodayView({ config, initialTasks, initialDays }: { config: PlannerConfig; initialTasks: Task[]; initialDays: PlannerDay[] }) {
  const client = useSyncExternalStore(subscribe, () => true, () => false);
  if (!client) return <TodaySkeleton />;
  return <Today config={config} initialTasks={initialTasks} initialDays={initialDays} />;
}

function Today({ config: initialConfig, initialTasks, initialDays }: { config: PlannerConfig; initialTasks: Task[]; initialDays: PlannerDay[] }) {
  const today = dayKey();
  const [tasks, setTasks] = useState(initialTasks);
  const [days, setDays] = useState(initialDays);
  const [config, setConfig] = useState(initialConfig);
  const [, start] = useTransition();

  const doneCol = config.columns.find((c) => c.done)?.id;
  const openCol = config.columns.find((c) => !c.done)?.id;
  const doneCols = new Set(config.columns.filter((c) => c.done).map((c) => c.id));
  const day: PlannerDay = days.find((d) => d.date === today) ?? {
    date: today,
    intention: "",
    top3: [],
    habits: [],
    focusMinutes: 0,
    focusSessions: 0,
    review: { win: "", improve: "", energy: 0 },
    reviewedAt: null,
  };
  const putDay = (d: PlannerDay) => setDays((xs) => [...xs.filter((x) => x.date !== d.date), d]);

  const from = addDays(today, -125);
  const stats = dayStats(tasks, days, config, from, today);
  const s = streaks(stats, config.dailyGoal, today);
  const todayStat = stats.get(today)!;
  const total = [...stats.values()].reduce((a, b) => a + b.points, 0);
  const lv = level(total);

  /** Tick a task done (or back open) from anywhere on the page. */
  const toggleTask = (t: Task, done: boolean) => {
    const column = done ? doneCol : openCol;
    if (!column) return;
    const prev = t;
    setTasks((xs) => xs.map((x) => (x.id === t.id ? { ...x, columnId: column, completedAt: done ? new Date().toISOString() : null } : x)));
    if (done) toast.success(`+${POINTS.task[t.priority] ?? 10} · ${t.title}`, { description: celebrate(todayStat.done + 1, config.dailyGoal) });
    start(async () => {
      const res = await updateTask(t.id, { columnId: column });
      if (!res.ok || !res.data) {
        setTasks((xs) => xs.map((x) => (x.id === t.id ? prev : x)));
        return void toast.error(res.ok ? "Couldn't save" : res.error);
      }
      const saved = res.data;
      setTasks((xs) => xs.map((x) => (x.id === saved.id ? saved : x)));
      notifyShell();
    });
  };

  const setGoal = (n: number) => {
    const goal = Math.max(1, Math.min(20, n));
    setConfig((c) => ({ ...c, dailyGoal: goal }));
    start(async () => {
      const res = await saveRitualSettings({ dailyGoal: goal });
      if (!res.ok) toast.error(res.error);
    });
  };

  const saveIntention = (intention: string) =>
    start(async () => {
      const res = await saveDayPlan(today, { intention });
      if (!res.ok || !res.data) return void toast.error(res.ok ? "Couldn't save" : res.error);
      putDay(res.data);
    });

  const open = tasks.filter((t) => !doneCols.has(t.columnId));
  const dueNow = open.filter((t) => (dueKey(t.due) ?? "9999") <= today);
  const hour = new Date().getHours();

  return (
    <div className="flex flex-col gap-5">
      {/* Hero: intention + the three numbers that keep you honest */}
      <section aria-label="Today at a glance" className="instrument grid gap-5 p-5 lg:grid-cols-[1.25fr_1fr] lg:p-6">
        <div className="flex flex-col justify-between gap-4">
          <div>
            <p className="engraved font-mono text-[11px] uppercase tracking-[0.16em]">
              {hour < 12 ? "Morning plan" : hour < 17 ? "Afternoon check-in" : "Evening"} ·{" "}
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <label htmlFor="intention" className="mt-3 block font-display text-[15px] font-extrabold">
              Today&apos;s one thing
            </label>
            <input
              id="intention"
              defaultValue={day.intention}
              maxLength={200}
              placeholder="If I only do one thing today, it's…"
              onBlur={(e) => e.target.value.trim() !== day.intention && saveIntention(e.target.value.trim())}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="groove mt-2 w-full !rounded-2xl bg-transparent px-4 py-3.5 font-display text-[20px] font-extrabold tracking-[-0.01em] outline-none placeholder:font-sans placeholder:text-[16px] placeholder:font-normal placeholder:text-muted focus-visible:ring-2 focus-visible:ring-copper/60 sm:text-[24px]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[13px]">
            <span className="engraved">Daily goal</span>
            <div className="keycap flex items-center">
              <button type="button" aria-label="Lower daily goal" onClick={() => setGoal(config.dailyGoal - 1)} className="grid size-8 cursor-pointer place-items-center">
                <Minus className="size-3.5" />
              </button>
              <span className="min-w-16 text-center font-mono text-[13px] font-semibold">
                {config.dailyGoal} {config.dailyGoal === 1 ? "task" : "tasks"}
              </span>
              <button type="button" aria-label="Raise daily goal" onClick={() => setGoal(config.dailyGoal + 1)} className="grid size-8 cursor-pointer place-items-center">
                <Plus className="size-3.5" />
              </button>
            </div>
            <span className="text-muted">Hit it every day to grow your streak.</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Readout
            icon={<Flame className={cn("size-4", s.current > 0 ? "text-[var(--screen-amber)]" : "text-[var(--screen-dim)]")} aria-hidden="true" />}
            label="Streak"
            value={s.current}
            unit={s.current === 1 ? "day" : "days"}
            foot={s.todayMet ? "Today counts ✓" : `${Math.max(0, config.dailyGoal - todayStat.done)} to go today`}
            hot={s.todayMet}
          />
          <Readout
            icon={<Target className="size-4 text-[var(--screen-amber)]" aria-hidden="true" />}
            label="Today"
            value={todayStat.points}
            unit="pts"
            foot={`${todayStat.done}/${config.dailyGoal} tasks done`}
            meter={Math.min(1, todayStat.done / config.dailyGoal)}
          />
          <Readout
            icon={<Trophy className="size-4 text-[var(--screen-amber)]" aria-hidden="true" />}
            label={`Level ${lv.level}`}
            value={levelTitle(lv.level)}
            foot={`${lv.into}/${lv.need} to level ${lv.level + 1}`}
            meter={lv.progress}
            small
          />
          <p className="engraved col-span-3 text-right font-mono text-[10.5px] uppercase tracking-[0.12em]">Best streak {s.best} days</p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <InstrumentCard title="Top 3 today" meta={`${day.top3.filter((id) => doneCols.has(tasks.find((t) => t.id === id)?.columnId ?? "")).length}/${day.top3.length || 3} done`}>
          <TopThree today={today} day={day} tasks={tasks} doneCols={doneCols} onDay={putDay} onToggle={toggleTask} />
        </InstrumentCard>
        <InstrumentCard title="Focus" meta={`${day.focusMinutes} min today`}>
          <FocusTimer
            today={today}
            length={config.focusLength}
            sessions={day.focusSessions}
            tasks={tasks.filter((t) => day.top3.includes(t.id) && !doneCols.has(t.columnId))}
            onDay={putDay}
            onLength={(n) => {
              setConfig((c) => ({ ...c, focusLength: n }));
              start(async () => void (await saveRitualSettings({ focusLength: n })));
            }}
          />
        </InstrumentCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <InstrumentCard title="Habits" meta={`${day.habits.filter((h) => config.habits.some((x) => x.id === h)).length}/${config.habits.length} today`}>
          <Habits today={today} day={day} days={days} habits={config.habits} onDay={putDay} onHabits={(habits) => setConfig((c) => ({ ...c, habits }))} />
        </InstrumentCard>
        <InstrumentCard title="Due now" meta={dueNow.length ? `${dueNow.length} open` : "Clear"} action={{ href: "/admin/planner", label: "Board" }}>
          <DueList today={today} tasks={dueNow} onToggle={toggleTask} />
        </InstrumentCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <InstrumentCard title="Activity" meta="16 weeks">
          <Heatmap today={today} stats={stats} goal={config.dailyGoal} />
        </InstrumentCard>
        <InstrumentCard title="Close the day" meta={day.reviewedAt ? "Closed" : hour >= 17 ? "Time to review" : "Tonight"}>
          <Review today={today} day={day} stat={todayStat} goalMet={s.todayMet} onDay={putDay} />
        </InstrumentCard>
      </div>

      <p className="text-center text-[12.5px] text-muted">
        Points: finished task 10–25 by priority · focus session {POINTS.focus} · habit {POINTS.habit} · closing the day {POINTS.review}.{" "}
        <Link href="/admin/planner/progress" className="inline-flex items-center gap-1 font-semibold text-ink hover:underline">
          See your progress <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </p>
    </div>
  );
}

function celebrate(done: number, goal: number) {
  if (done === goal) return "Daily goal hit. The streak lives.";
  if (done > goal) return "Above goal. Bank it.";
  return `${goal - done} more to hit today's goal.`;
}

/** A readout on a small recessed screen. */
function Readout({
  icon,
  label,
  value,
  unit,
  foot,
  meter,
  hot,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  unit?: string;
  foot: string;
  meter?: number;
  hot?: boolean;
  small?: boolean;
}) {
  return (
    <div className={cn("screen flex flex-col gap-2 p-3", hot && "shadow-[inset_0_2px_8px_rgb(0_0_0/0.75),0_0_24px_-4px_rgb(224_154_79/0.6)]")}>
      <p className="relative z-[1] flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--screen-dim)]">
        {icon}
        {label}
      </p>
      <p className="relative z-[1] flex items-baseline gap-1">
        <span
          className={cn(
            "font-mono font-semibold leading-none text-[var(--screen-amber)] [text-shadow:0_0_14px_rgb(224_154_79/0.55)]",
            small ? "text-[15px]" : "text-[34px]",
          )}
        >
          {value}
        </span>
        {unit && <span className="font-mono text-[10.5px] uppercase text-[var(--screen-dim)]">{unit}</span>}
      </p>
      {meter !== undefined && (
        <div className="relative z-[1] h-1.5 overflow-hidden rounded-full bg-white/8">
          <div className="lit h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.round(meter * 100)}%` }} />
        </div>
      )}
      <p className="relative z-[1] mt-auto font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--screen-dim)]">{foot}</p>
    </div>
  );
}

function TodaySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading today" className="flex animate-pulse flex-col gap-5">
      <div className="h-48 rounded-[22px] bg-paper-edge/30" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-72 rounded-[22px] bg-paper-edge/25" />
        <div className="h-72 rounded-[22px] bg-paper-edge/25" />
      </div>
    </div>
  );
}
