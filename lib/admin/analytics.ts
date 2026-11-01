import { CRM_TZ, openStages, stageLabel } from "./crm";
import type { Inquiry, Stage } from "./types";

/**
 * Sales analytics from your own lead records (no tracking service needed).
 * Pure functions: the Analytics page and the dashboard both call them.
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** How far a lead got. Lost leads count as having reached the stage they had replies at. */
const order: Stage[] = ["new", "contacted", "proposal", "won"];
function reached(l: Inquiry): number {
  if (l.stage === "lost") return l.firstReplyAt ? 1 : 0;
  return order.indexOf(l.stage);
}

export type FunnelStep = { id: Stage; label: string; count: number; rate: number | null };

/** Leads that reached each stage, and the share that moved on from the step before. */
export function funnel(leads: Inquiry[]): FunnelStep[] {
  return order.map((id, i) => {
    const count = leads.filter((l) => reached(l) >= i).length;
    const prev = i === 0 ? null : leads.filter((l) => reached(l) >= i - 1).length;
    return { id, label: stageLabel[id], count, rate: prev ? count / prev : null };
  });
}

export type Bucket = { label: string; count: number };

/** How fast you replied: first reply minus arrival, bucketed. */
export function replySpeed(leads: Inquiry[]): { buckets: Bucket[]; median: number | null } {
  const ms = leads
    .filter((l) => l.firstReplyAt)
    .map((l) => new Date(l.firstReplyAt!).getTime() - new Date(l.createdAt).getTime())
    .filter((x) => x >= 0)
    .sort((a, b) => a - b);
  const edges: [string, number][] = [
    ["< 1h", HOUR],
    ["1–4h", 4 * HOUR],
    ["4–24h", DAY],
    ["1–3d", 3 * DAY],
    ["3d +", Infinity],
  ];
  let lo = 0;
  const buckets = edges.map(([label, hi]) => {
    const count = ms.filter((x) => x >= lo && x < hi).length;
    lo = hi;
    return { label, count };
  });
  return { buckets, median: ms.length ? ms[Math.floor(ms.length / 2)] : null };
}

/** Value won per month, last `months` months (by close date). */
export function wonByMonth(leads: Inquiry[], months = 6, now = new Date()): { label: string; key: string; value: number; deals: number }[] {
  const out = Array.from({ length: months }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - i), 1));
    return {
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
      value: 0,
      deals: 0,
    };
  });
  for (const l of leads) {
    if (l.stage !== "won" || !l.closedAt) continue;
    const m = out.find((x) => x.key === l.closedAt!.slice(0, 7));
    if (m) {
      m.value += l.value;
      m.deals += 1;
    }
  }
  return out;
}

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const slots = ["Night", "Morning", "Afternoon", "Evening"]; // 0–6, 6–12, 12–18, 18–24

/** When leads arrive, in your time zone: weekday × part of day. */
export function arrivalHeat(leads: Inquiry[]) {
  const grid = dayNames.map(() => slots.map(() => 0));
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: CRM_TZ, weekday: "short", hour: "numeric", hourCycle: "h23" });
  for (const l of leads) {
    const parts = fmt.formatToParts(new Date(l.createdAt));
    const wd = dayNames.indexOf(parts.find((p) => p.type === "weekday")?.value ?? "");
    const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    if (wd >= 0) grid[wd][Math.min(3, Math.floor(h / 6))] += 1;
  }
  const max = Math.max(0, ...grid.flat());
  let best: { day: string; slot: string } | null = null;
  if (max > 0)
    grid.forEach((row, d) =>
      row.forEach((v, s) => {
        if (v === max && !best) best = { day: dayNames[d], slot: slots[s] };
      }),
    );
  return { days: dayNames, slots, grid, max, best: best as { day: string; slot: string } | null };
}

/** Open deals by how long they've waited since arriving. Old ones go cold. */
export function dealAgeing(leads: Inquiry[], now = Date.now()): (Bucket & { value: number; stale: boolean })[] {
  const open = leads.filter((l) => l.status !== "archived" && openStages.includes(l.stage));
  const edges: [string, number, boolean][] = [
    ["0–7 days", 7, false],
    ["8–14 days", 14, false],
    ["15–30 days", 30, true],
    ["30+ days", Infinity, true],
  ];
  let lo = 0;
  return edges.map(([label, hi, stale]) => {
    const xs = open.filter((l) => {
      const age = (now - new Date(l.createdAt).getTime()) / DAY;
      return age >= lo && age < hi;
    });
    lo = hi;
    return { label, count: xs.length, value: xs.reduce((s, l) => s + l.value, 0), stale };
  });
}

/** Chance each open stage turns into a signed project (adjust to your own history). */
export const stageOdds: Partial<Record<Stage, number>> = { new: 0.1, contacted: 0.25, proposal: 0.5 };

/** Weighted forecast plus the money facts: average deal, sales cycle, best source of value. */
export function salesFacts(leads: Inquiry[]) {
  const open = leads.filter((l) => l.status !== "archived" && openStages.includes(l.stage));
  const forecast = open.reduce((s, l) => s + l.value * (stageOdds[l.stage] ?? 0), 0);
  const won = leads.filter((l) => l.stage === "won");
  const avgDeal = won.length ? won.reduce((s, l) => s + l.value, 0) / won.length : null;
  const cycles = won.filter((l) => l.closedAt).map((l) => (new Date(l.closedAt!).getTime() - new Date(l.createdAt).getTime()) / DAY);
  const cycle = cycles.length ? cycles.reduce((a, b) => a + b, 0) / cycles.length : null;
  const unvalued = open.filter((l) => !l.value).length;
  return { forecast, avgDeal, cycle, unvalued, openCount: open.length };
}
