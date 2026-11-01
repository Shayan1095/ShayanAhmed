import type { Inquiry, Stage } from "./types";

/** Pipeline stages, in order. Shared by the dashboard, the leads board and the server actions. */
export const stages: { id: Stage; label: string; hint: string }[] = [
  { id: "new", label: "New", hint: "Waiting for your first reply" },
  { id: "contacted", label: "Contacted", hint: "You've replied; talking it through" },
  { id: "proposal", label: "Proposal", hint: "Quote or proposal sent" },
  { id: "won", label: "Won", hint: "Signed: the project is yours" },
  { id: "lost", label: "Lost", hint: "Didn't go ahead" },
];

export const stageLabel = Object.fromEntries(stages.map((s) => [s.id, s.label])) as Record<Stage, string>;

/** Stages that still need work (counted in pipeline value). */
export const openStages: Stage[] = ["new", "contacted", "proposal"];

export const leadSources = ["website", "referral", "linkedin", "whatsapp", "email", "other"] as const;
export const sourceLabel: Record<string, string> = {
  website: "Website form",
  referral: "Referral",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  email: "Email",
  other: "Other",
};

/** Leads in the pipeline: everything not archived. */
export const inPipeline = (i: Inquiry) => i.status !== "archived";

/** Your time zone, for "when do leads arrive" (weekday and time of day). */
export const CRM_TZ = "Asia/Karachi";

/** Currency for deal values. Change here if you quote in another currency. */
export const CRM_CURRENCY = "USD";

export function money(n: number, compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CRM_CURRENCY,
    maximumFractionDigits: 0,
    notation: compact && n >= 10_000 ? "compact" : "standard",
  }).format(n);
}

/** "3h", "2d", "5w": how long ago, short. */
export function ago(iso: string, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 14) return `${d}d`;
  return `${Math.round(d / 7)}w`;
}

/** Duration in ms as "4h 20m" / "2d 3h". */
export function duration(ms: number) {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ${mins % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}
