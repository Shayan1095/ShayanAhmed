import { inPipeline, openStages, stages } from "./crm";
import type { Inquiry, Stage, Task } from "./types";

/**
 * Dashboard numbers, all derived from real records (no analytics service
 * needed). Weeks start on Monday, UTC.
 */

const DAY = 86_400_000;

function mondayUTC(d: Date) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x;
}

export type Kpi = {
  id: string;
  label: string;
  value: string;
  /** Plain-language context under the number. */
  note: string;
  /** Change vs the previous period, when it means something. */
  delta?: { text: string; good: boolean | null };
  spark?: number[];
};

export type WeekBar = { label: string; start: string; leads: number; won: number };
export type StageBar = { id: Stage; label: string; count: number; value: number };
export type SourceBar = { label: string; count: number };

export function leadMetrics(all: Inquiry[], now = new Date()) {
  const leads = all.filter(inPipeline);
  const t = now.getTime();

  // Leads per week, last 12 weeks.
  const thisMonday = mondayUTC(now);
  const weeks: WeekBar[] = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(thisMonday.getTime() - (11 - i) * 7 * DAY);
    return {
      start: start.toISOString(),
      label: start.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
      leads: 0,
      won: 0,
    };
  });
  const firstWeek = new Date(weeks[0].start).getTime();
  for (const l of all) {
    const at = new Date(l.createdAt).getTime();
    if (at < firstWeek) continue;
    const idx = Math.min(11, Math.floor((at - firstWeek) / (7 * DAY)));
    weeks[idx].leads += 1;
    if (l.stage === "won") weeks[idx].won += 1;
  }

  // Last 30 days vs the 30 before.
  const in30 = all.filter((l) => t - new Date(l.createdAt).getTime() < 30 * DAY).length;
  const prev30 = all.filter((l) => {
    const age = t - new Date(l.createdAt).getTime();
    return age >= 30 * DAY && age < 60 * DAY;
  }).length;

  const waiting = leads.filter((l) => l.stage === "new");
  const oldestWaiting = waiting.reduce<string | null>((o, l) => (!o || l.createdAt < o ? l.createdAt : o), null);

  const replied = all.filter((l) => l.firstReplyAt && t - new Date(l.createdAt).getTime() < 90 * DAY);
  const avgReply = replied.length
    ? replied.reduce((s, l) => s + (new Date(l.firstReplyAt!).getTime() - new Date(l.createdAt).getTime()), 0) / replied.length
    : null;

  const open = leads.filter((l) => openStages.includes(l.stage));
  const pipelineValue = open.reduce((s, l) => s + l.value, 0);
  const won = all.filter((l) => l.stage === "won");
  const lost = all.filter((l) => l.stage === "lost");
  const winRate = won.length + lost.length ? won.length / (won.length + lost.length) : null;
  const wonValue = won.reduce((s, l) => s + l.value, 0);

  const byStage: StageBar[] = stages.map((s) => {
    const xs = (s.id === "won" || s.id === "lost" ? all : leads).filter((l) => l.stage === s.id);
    return { id: s.id, label: s.label, count: xs.length, value: xs.reduce((v, l) => v + l.value, 0) };
  });

  // What people ask for: project type (form) or source (manual leads).
  const counts = new Map<string, number>();
  for (const l of all) {
    const k = l.projectType.trim() || "Not specified";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const sorted = [...counts].sort((a, b) => b[1] - a[1]);
  const sources: SourceBar[] = sorted.slice(0, 5).map(([label, count]) => ({ label, count }));
  const rest = sorted.slice(5).reduce((s, [, c]) => s + c, 0);
  if (rest) sources.push({ label: "Other", count: rest });

  return { weeks, in30, prev30, waiting, oldestWaiting, avgReply, open, pipelineValue, won, lost, winRate, wonValue, byStage, sources };
}

export type FeedItem = { id: string; at: string; kind: "lead" | "stage" | "note" | "task" | "followup" | "value" | "email"; text: string; href: string };

/** Recent activity across leads and the planner, newest first. */
export function activityFeed(leads: Inquiry[], tasks: Task[], limit = 8): FeedItem[] {
  const items: FeedItem[] = [];
  for (const l of leads) {
    const href = `/admin/inbox?lead=${l.id}`;
    if (l.source === "website") items.push({ id: `${l.id}-in`, at: l.createdAt, kind: "lead", text: `New enquiry from ${l.name}`, href });
    for (const a of l.activity)
      items.push({
        id: a.id,
        at: a.at,
        kind: a.kind === "created" ? "lead" : a.kind,
        text: a.kind === "created" ? `${l.name} added as a lead` : a.kind === "note" ? `Note on ${l.name}: ${a.text}` : `${l.name}: ${a.text}`,
        href,
      });
  }
  for (const t of tasks) if (t.completedAt) items.push({ id: `${t.id}-done`, at: t.completedAt, kind: "task", text: `Finished "${t.title}"`, href: "/admin/planner" });
  return items.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, limit);
}
