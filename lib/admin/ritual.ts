import { addDays, dayKey } from "./dates";
import type { PlannerConfig, PlannerDay, Priority, Task } from "./types";

/**
 * The Today page's game layer, computed in the viewer's local time:
 * points per day, the streak (days the daily goal was met), level from all
 * points earned, habit streaks and the activity heatmap.
 */

/** Points: a finished task by priority, plus focus, habits and closing the day. */
export const POINTS = {
  task: { none: 10, low: 10, medium: 15, high: 20, urgent: 25 } as Record<Priority, number>,
  focus: 5,
  habit: 5,
  review: 10,
};

export type DayStat = { key: string; done: number; points: number; focus: number; habits: number; reviewed: boolean };

export function dayStats(tasks: Task[], days: PlannerDay[], config: PlannerConfig, from: string, to: string): Map<string, DayStat> {
  const map = new Map<string, DayStat>();
  for (let k = from; k <= to; k = addDays(k, 1)) map.set(k, { key: k, done: 0, points: 0, focus: 0, habits: 0, reviewed: false });
  for (const t of tasks) {
    if (!t.completedAt) continue;
    const s = map.get(dayKey(new Date(t.completedAt)));
    if (!s) continue;
    s.done += 1;
    s.points += POINTS.task[t.priority] ?? 10;
  }
  const habitIds = new Set(config.habits.map((h) => h.id));
  for (const d of days) {
    const s = map.get(d.date);
    if (!s) continue;
    const habits = d.habits.filter((h) => habitIds.has(h)).length;
    s.focus = d.focusMinutes;
    s.habits = habits;
    s.reviewed = Boolean(d.reviewedAt);
    s.points += d.focusSessions * POINTS.focus + habits * POINTS.habit + (d.reviewedAt ? POINTS.review : 0);
  }
  return map;
}

/** Consecutive days meeting the goal, ending today (or yesterday while today is still in play). */
export function streaks(stats: Map<string, DayStat>, goal: number, today: string) {
  const met = (k: string) => (stats.get(k)?.done ?? 0) >= goal;
  let current = 0;
  let k = met(today) ? today : addDays(today, -1);
  while (stats.has(k) && met(k)) {
    current += 1;
    k = addDays(k, -1);
  }
  let best = 0;
  let run = 0;
  for (const [key] of stats) {
    run = met(key) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return { current, best, todayMet: met(today) };
}

/** Level from total points: each level needs 100 more points than the last (100, 300, 600, …). */
export function level(totalPoints: number) {
  let lvl = 1;
  let need = 100;
  let floor = 0;
  while (totalPoints >= floor + need) {
    floor += need;
    lvl += 1;
    need += 100;
  }
  return { level: lvl, into: totalPoints - floor, need, progress: (totalPoints - floor) / need };
}

export const levelTitles = ["Starter", "Builder", "Operator", "Craftsman", "Specialist", "Studio lead", "Principal", "Master"];
export const levelTitle = (lvl: number) => levelTitles[Math.min(levelTitles.length - 1, lvl - 1)];

/** Each habit's current streak (consecutive days checked, ending today or yesterday). */
export function habitStreak(days: PlannerDay[], habitId: string, today: string) {
  const checked = new Set(days.filter((d) => d.habits.includes(habitId)).map((d) => d.date));
  let n = 0;
  let k = checked.has(today) ? today : addDays(today, -1);
  while (checked.has(k)) {
    n += 1;
    k = addDays(k, -1);
  }
  return n;
}

/** Week columns (Monday first) for the heatmap, `weeks` back to this week. */
export function heatWeeks(today: string, weeks = 16): string[][] {
  const [y, m, d] = today.split("-").map(Number);
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;
  const monday = addDays(today, -dow);
  return Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, i) => addDays(monday, (w - (weeks - 1)) * 7 + i)));
}
