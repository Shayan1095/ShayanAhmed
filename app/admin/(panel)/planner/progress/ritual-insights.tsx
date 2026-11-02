"use client";

import { useSyncExternalStore } from "react";
import { BatteryMedium, BookOpen, Clock, Flame, Repeat } from "lucide-react";
import { addDays, dayKey, weekStart } from "@/lib/admin/dates";
import { dayStats, streaks } from "@/lib/admin/ritual";
import type { PlannerConfig, PlannerDay, Task } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { LedColumns } from "../../analytics/instruments";
import { InstrumentCard } from "../../dashboard/charts";

const subscribe = () => () => {};
const energyLabel = ["", "Drained", "Low", "Okay", "Good", "Sharp"];
const short = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/**
 * The habits behind the results: streaks against the daily goal, focus hours
 * per week, habit consistency, energy over time and the evening-review
 * journal. Computed in your time zone from the Today page's records.
 */
export function RitualInsights({ config, tasks, days }: { config: PlannerConfig; tasks: Task[]; days: PlannerDay[] }) {
  const client = useSyncExternalStore(subscribe, () => true, () => false);
  if (!client) return <div aria-busy="true" className="mb-5 h-64 animate-pulse rounded-[22px] bg-paper-edge/25" />;

  const today = dayKey();
  const stats = dayStats(tasks, days, config, addDays(today, -125), today);
  const s = streaks(stats, config.dailyGoal, today);
  const monday = weekStart(new Date());

  // Focus minutes per week, last 8 weeks.
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(monday, (i - 7) * 7);
    const mins = days.filter((d) => d.date >= start && d.date <= addDays(start, 6)).reduce((n, d) => n + d.focusMinutes, 0);
    return { label: i === 7 ? "Now" : short.format(new Date(`${start}T12:00:00`)), count: mins, text: mins ? `${(mins / 60).toFixed(1)}h` : "0" };
  });
  const focus8 = weeks.reduce((n, w) => n + w.count, 0);

  // Habit consistency over the last 28 days (today included).
  const window28 = Array.from({ length: 28 }, (_, i) => addDays(today, -i));
  const byDate = new Map(days.map((d) => [d.date, d]));
  const habits = config.habits.map((h) => {
    const hit = window28.filter((k) => byDate.get(k)?.habits.includes(h.id)).length;
    return { ...h, hit, rate: hit / 28 };
  });
  const consistency = habits.length ? habits.reduce((n, h) => n + h.rate, 0) / habits.length : 0;

  // Energy, last 14 days with a review.
  const reviewed = days.filter((d) => d.reviewedAt && d.review.energy).sort((a, b) => a.date.localeCompare(b.date));
  const energy = reviewed.slice(-14).map((d) => ({ label: short.format(new Date(`${d.date}T12:00:00`)), count: d.review.energy, text: String(d.review.energy), warn: d.review.energy <= 2 }));
  const avgEnergy = reviewed.length ? reviewed.slice(-14).reduce((n, d) => n + d.review.energy, 0) / Math.min(14, reviewed.length) : null;
  const journal = [...reviewed].reverse().filter((d) => d.review.win || d.review.improve).slice(0, 8);

  return (
    <div className="mb-6 flex flex-col gap-5">
      <section aria-label="Discipline" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Flame, k: "Streak", v: `${s.current}d`, note: `Best ${s.best} days · goal ${config.dailyGoal}/day` },
          { icon: Clock, k: "Focus, 8 wks", v: `${(focus8 / 60).toFixed(1)}h`, note: `${weeks[7].text} this week` },
          { icon: Repeat, k: "Habits, 28 days", v: `${Math.round(consistency * 100)}%`, note: `${habits.length} habits tracked` },
          { icon: BatteryMedium, k: "Energy", v: avgEnergy === null ? "—" : avgEnergy.toFixed(1), note: avgEnergy === null ? "Close a day to start" : `Avg of last ${Math.min(14, reviewed.length)} reviews` },
        ].map((x) => (
          <div key={x.k} className="instrument p-3">
            <div className="screen px-4 py-3">
              <p className="relative z-[1] flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--screen-dim)]">
                <x.icon className="size-3.5 text-[var(--screen-amber)]" aria-hidden="true" /> {x.k}
              </p>
              <p className="relative z-[1] mt-1 font-mono text-[28px] font-semibold leading-none text-[var(--screen-amber)] [text-shadow:0_0_14px_rgb(224_154_79/0.5)]">{x.v}</p>
            </div>
            <p className="engraved mt-2 px-1 text-[11.5px]">{x.note}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[1.3fr_1fr]">
        <InstrumentCard title="Focus hours" meta="8 weeks">
          <LedColumns buckets={weeks} caption="Focus time per week, last 8 weeks" highlight={7} />
        </InstrumentCard>
        <InstrumentCard title="Habit consistency" meta="Last 28 days">
          {habits.length === 0 ? (
            <p className="text-[13.5px] text-muted">Add habits on the Today page to track them here.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {habits.map((h) => (
                <li key={h.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="flex min-w-0 items-center gap-2 font-semibold">
                      <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: h.color }} />
                      <span className="truncate">{h.name}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[12px] text-muted">
                      {h.hit}/28 · <span className="font-semibold text-copper-ink">{Math.round(h.rate * 100)}%</span>
                    </span>
                  </div>
                  <div className="groove h-3 p-[3px]">
                    <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${h.rate * 100}%`, background: h.color, boxShadow: `0 0 8px ${h.color}` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </InstrumentCard>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[1fr_1.3fr]">
        <InstrumentCard title="Energy" meta="Evening reviews">
          {energy.length ? (
            <LedColumns buckets={energy} caption="Energy rating (1 to 5) from recent evening reviews" highlight={energy.length - 1} />
          ) : (
            <p className="text-[13.5px] text-muted">Rate your energy when you close the day; the trend shows here.</p>
          )}
        </InstrumentCard>
        <InstrumentCard title="Journal" meta={journal.length ? `${journal.length} recent` : "Empty"}>
          {journal.length === 0 ? (
            <p className="flex items-center gap-2 text-[13.5px] text-muted">
              <BookOpen className="size-4" aria-hidden="true" /> Your evening wins and lessons collect here.
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {journal.map((d) => (
                <li key={d.date} className="rounded-xl bg-paper-lo/40 px-3.5 py-2.5">
                  <p className="flex items-center justify-between gap-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">
                    {new Date(`${d.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    <span className={cn(d.review.energy <= 2 ? "text-alert" : "text-copper-ink")}>{energyLabel[d.review.energy]}</span>
                  </p>
                  {d.review.win && <p className="mt-1 text-[13.5px] leading-snug"><span className="font-semibold">Win:</span> {d.review.win}</p>}
                  {d.review.improve && <p className="mt-0.5 text-[13px] leading-snug text-muted"><span className="font-semibold text-ink">Better:</span> {d.review.improve}</p>}
                </li>
              ))}
            </ol>
          )}
        </InstrumentCard>
      </div>
    </div>
  );
}
