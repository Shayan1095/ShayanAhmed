"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Flame, Target, TriangleAlert, CircleCheck } from "lucide-react";
import { addDays, dayKey, dueKey, weekStart } from "@/lib/admin/dates";
import type { PlannerConfig, Task } from "@/lib/admin/types";

const WEEKS = 8;
const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

// Progress is computed in the viewer's time zone, so it renders on the client only.
const subscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

/**
 * How the work is going: this week against the goal, a daily streak, the last
 * eight weeks, progress per list, and what was finished recently.
 */
export function ProgressView({ config, tasks }: { config: PlannerConfig; tasks: Task[] }) {
  const client = useIsClient();
  if (!client) return <div aria-busy="true" className="h-96 animate-pulse rounded-xl bg-paper-edge/25" />;
  return <Stats config={config} tasks={tasks} />;
}

function Stats({ config, tasks }: { config: PlannerConfig; tasks: Task[] }) {
  const doneCols = useMemo(() => new Set(config.columns.filter((c) => c.done).map((c) => c.id)), [config.columns]);
  const today = dayKey();
  const thisWeek = weekStart(new Date());

  const s = useMemo(() => {
    const completed = tasks.filter((t) => t.completedAt).map((t) => ({ t, day: dayKey(new Date(t.completedAt!)) }));
    const days = new Set(completed.map((c) => c.day));

    // Streak: consecutive days with at least one task done, ending today (or yesterday if today is still open).
    let streak = 0;
    let cursor = days.has(today) ? today : addDays(today, -1);
    while (days.has(cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }

    const weeks = Array.from({ length: WEEKS }, (_, i) => {
      const start = addDays(thisWeek, (i - (WEEKS - 1)) * 7);
      const end = addDays(start, 6);
      return { start, count: completed.filter((c) => c.day >= start && c.day <= end).length };
    });

    const open = tasks.filter((t) => !doneCols.has(t.columnId));
    const overdue = open.filter((t) => (dueKey(t.due) ?? "9999") < today).length;
    const lists = [...config.lists, { id: "", name: "No list", color: "#8a8172" }]
      .map((l) => {
        const inList = tasks.filter((t) => t.listId === l.id);
        return { ...l, total: inList.length, done: inList.filter((t) => doneCols.has(t.columnId)).length };
      })
      .filter((l) => l.total > 0);
    const recent = completed
      .sort((a, b) => b.t.completedAt!.localeCompare(a.t.completedAt!))
      .slice(0, 8)
      .map((c) => c.t);

    return { weeks, streak, open: open.length, overdue, lists, recent, doneAll: completed.length };
  }, [tasks, config.lists, doneCols, today, thisWeek]);

  const doneThisWeek = s.weeks[WEEKS - 1].count;
  const goal = config.weeklyGoal;
  const pct = Math.min(1, doneThisWeek / goal);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Goal ring: a single headline, so a ring plus the number, not a chart */}
        <div className="flex items-center gap-4 surface rounded-2xl p-4 sm:col-span-2 lg:col-span-1">
          <svg viewBox="0 0 64 64" className="size-16 shrink-0 -rotate-90" aria-hidden="true">
            <circle cx="32" cy="32" r="27" fill="none" stroke="var(--color-paper-edge)" strokeOpacity=".5" strokeWidth="7" />
            <circle
              cx="32"
              cy="32"
              r="27"
              fill="none"
              stroke="var(--color-copper)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${pct * 169.6} 169.6`}
            />
          </svg>
          <div>
            <p className="flex items-center gap-1.5 text-[12.5px] text-muted">
              <Target className="size-3.5" aria-hidden="true" /> This week
            </p>
            <p className="font-display text-[26px] font-extrabold leading-tight">
              {doneThisWeek}
              <span className="text-[15px] font-bold text-muted"> / {goal}</span>
            </p>
            <p className="text-[12.5px] text-muted">{doneThisWeek >= goal ? "Goal reached" : `${goal - doneThisWeek} to go`}</p>
          </div>
        </div>
        <Stat icon={<Flame className="size-3.5" aria-hidden="true" />} label="Active days in a row" value={s.streak} unit={s.streak === 1 ? "day" : "days"} />
        <Stat icon={<CircleCheck className="size-3.5" aria-hidden="true" />} label="Done all time" value={s.doneAll} unit="tasks" />
        <Stat
          icon={<TriangleAlert className="size-3.5" aria-hidden="true" />}
          label="Open"
          value={s.open}
          unit={s.overdue ? `· ${s.overdue} overdue` : "tasks"}
          warn={s.overdue > 0}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <WeeksChart weeks={s.weeks} goal={goal} />
        <section className="surface rounded-2xl p-5">
          <h2 className="text-[14px] font-semibold">Progress by list</h2>
          <p className="mb-4 text-[12.5px] text-muted">Done out of all tasks in each list.</p>
          {s.lists.length === 0 ? (
            <p className="text-[13.5px] text-muted">No tasks yet.</p>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {s.lists.map((l) => (
                <li key={l.id || "none"}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2 font-medium">
                      <span aria-hidden="true" className="size-2 rounded-full" style={{ background: l.color }} />
                      {l.name}
                    </span>
                    <span className="font-mono text-[12px] text-muted">
                      {l.done}/{l.total}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${l.name} progress`}
                    aria-valuemin={0}
                    aria-valuemax={l.total}
                    aria-valuenow={l.done}
                    className="h-2 overflow-hidden rounded-full bg-paper-edge/40"
                  >
                    <div className="h-full rounded-full" style={{ width: `${(l.done / l.total) * 100}%`, background: l.color }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="surface rounded-2xl p-5">
        <h2 className="mb-3 text-[14px] font-semibold">Recently finished</h2>
        {s.recent.length === 0 ? (
          <p className="text-[13.5px] text-muted">Finished tasks show here. Move a task into a done column to log it.</p>
        ) : (
          <ul className="divide-y divide-paper-edge/50">
            {s.recent.map((t) => {
              const list = config.lists.find((l) => l.id === t.listId);
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-[14px]">
                  <span className="flex min-w-0 items-center gap-2">
                    <CircleCheck className="size-4 shrink-0 text-good" aria-hidden="true" />
                    <span className="truncate">{t.title}</span>
                    {list && <span className="hidden shrink-0 text-[12px] text-muted sm:inline">· {list.name}</span>}
                  </span>
                  <span className="shrink-0 font-mono text-[12px] text-muted">{shortDate.format(new Date(t.completedAt!))}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  unit,
  warn,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  warn?: boolean;
}) {
  return (
    <div className="surface rounded-2xl p-4">
      <p className="flex items-center gap-1.5 text-[12.5px] text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-display text-[26px] font-extrabold leading-tight">{value}</p>
      <p className={warn ? "text-[12.5px] font-medium text-alert" : "text-[12.5px] text-muted"}>{unit}</p>
    </div>
  );
}

/** Tasks done per week. One series, so one hue and no legend; the goal is a dashed reference line. */
function WeeksChart({ weeks, goal }: { weeks: { start: string; count: number }[]; goal: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 560;
  const H = 220;
  const pad = { top: 16, right: 12, bottom: 28, left: 28 };
  const max = Math.max(goal, ...weeks.map((w) => w.count), 1);
  const yMax = Math.ceil((max * 1.15) / 2) * 2;
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const slot = innerW / weeks.length;
  const barW = Math.min(36, slot * 0.56);
  const y = (v: number) => pad.top + innerH - (v / yMax) * innerH;
  const ticks = [0, yMax / 2, yMax];
  const label = (start: string) => shortDate.format(new Date(`${start}T12:00:00`));

  return (
    <section className="surface rounded-2xl p-5">
      <h2 className="text-[14px] font-semibold">Tasks done per week</h2>
      <p className="mb-3 text-[12.5px] text-muted">Last {weeks.length} weeks. The dashed line is your weekly goal ({goal}).</p>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Tasks done per week, last ${weeks.length} weeks`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="var(--color-paper-edge)" strokeOpacity=".55" />
              <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="fill-muted font-mono text-[10px]">
                {t}
              </text>
            </g>
          ))}
          {weeks.map((w, i) => {
            const cx = pad.left + slot * i + slot / 2;
            const h = Math.max(0, y(0) - y(w.count));
            const current = i === weeks.length - 1;
            return (
              <g key={w.start} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
                {/* hit target bigger than the bar */}
                <rect x={cx - slot / 2} y={pad.top} width={slot} height={innerH} fill="transparent" />
                {h > 0 && (
                  <path
                    d={`M${cx - barW / 2},${y(0)} V${y(w.count) + 4} q0,-4 4,-4 h${barW - 8} q4,0 4,4 V${y(0)} Z`}
                    fill="var(--color-copper)"
                    fillOpacity={hover === null || hover === i ? (current ? 1 : 0.72) : 0.35}
                  />
                )}
                <text x={cx} y={H - 9} textAnchor="middle" className={current ? "fill-ink font-mono text-[10px]" : "fill-muted font-mono text-[10px]"}>
                  {current ? "This wk" : label(w.start)}
                </text>
              </g>
            );
          })}
          <line
            x1={pad.left}
            x2={W - pad.right}
            y1={y(goal)}
            y2={y(goal)}
            stroke="var(--color-ink)"
            strokeOpacity=".55"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
          <text x={W - pad.right} y={y(goal) - 5} textAnchor="end" className="fill-ink/70 font-mono text-[10px]">
            goal
          </text>
        </svg>
        {hover !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md border border-paper-edge bg-paper-hi px-2.5 py-1.5 text-[12px] shadow-[0_4px_14px_-6px_rgb(17_17_17/.3)]"
            style={{
              left: `${((pad.left + slot * hover + slot / 2) / W) * 100}%`,
              top: `${(y(weeks[hover].count) / H) * 100}%`,
            }}
          >
            <p className="text-muted">Week of {label(weeks[hover].start)}</p>
            <p className="font-semibold">
              {weeks[hover].count} done {weeks[hover].count >= goal ? "· goal met" : ""}
            </p>
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>Tasks done per week</caption>
        <thead>
          <tr>
            <th>Week of</th>
            <th>Done</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.start}>
              <td>{label(w.start)}</td>
              <td>{w.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
