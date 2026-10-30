import "server-only";
import { plain } from "@/lib/content";
import { siteSettings } from "@/lib/content/data/site";
import type { Faq, Project, SiteSettings, Testimonial } from "@/lib/content/types";
import { connectDb } from "@/lib/db/connect";
import {
  FaqModel,
  InquiryModel,
  PlannerConfigModel,
  ProjectModel,
  SettingsModel,
  TaskModel,
  TestimonialModel,
} from "@/lib/db/models";
import { defaultPlannerConfig } from "./planner-defaults";
import type { Inquiry, PlannerConfig, Task } from "./types";

/**
 * Admin reads. Callers must have run requireAdmin() first. These are not
 * cached: the admin always sees the latest data, drafts included.
 */

export type DbState = "missing-env" | "unreachable" | "empty" | "ready";

export async function dbState(): Promise<DbState> {
  try {
    if (!(await connectDb())) return "missing-env";
  } catch {
    return "unreachable";
  }
  return (await SettingsModel.exists({ key: "site" })) ? "ready" : "empty";
}

export type ProjectRow = Project & { id: string };

export async function listProjects(): Promise<ProjectRow[]> {
  return (await ProjectModel.find().sort({ order: 1 }).lean()).map((d) => plain<ProjectRow>(d));
}

export async function getProjectById(id: string): Promise<ProjectRow | null> {
  if (!/^[a-f0-9]{24}$/.test(id)) return null;
  const d = await ProjectModel.findById(id).lean();
  return d ? plain<ProjectRow>(d) : null;
}

export async function listTestimonials(): Promise<Testimonial[]> {
  return (await TestimonialModel.find().sort({ order: 1 }).lean()).map((d) => plain<Testimonial>(d));
}

export async function listFaqs(): Promise<Faq[]> {
  return (await FaqModel.find().sort({ order: 1 }).lean()).map((d) => plain<Faq>(d));
}

export async function getSettings(): Promise<SiteSettings> {
  const d = await SettingsModel.findOne({ key: "site" }).lean();
  return { ...siteSettings, ...((d?.data as Partial<SiteSettings>) ?? {}) };
}

function toInquiry(d: unknown): Inquiry {
  const raw = JSON.parse(JSON.stringify(d)) as Record<string, unknown>;
  return {
    id: String(raw._id),
    name: String(raw.name),
    email: String(raw.email),
    projectType: String(raw.projectType ?? ""),
    budget: String(raw.budget ?? ""),
    message: String(raw.message),
    status: raw.status as Inquiry["status"],
    emailed: Boolean(raw.emailed),
    createdAt: String(raw.createdAt),
  };
}

export async function listInquiries(): Promise<Inquiry[]> {
  return (await InquiryModel.find().sort({ createdAt: -1 }).limit(500).lean()).map(toInquiry);
}

export async function getPlannerConfig(): Promise<PlannerConfig> {
  const d = await PlannerConfigModel.findOneAndUpdate(
    { key: "planner" },
    { $setOnInsert: defaultPlannerConfig },
    { upsert: true, returnDocument: "after" },
  ).lean();
  const raw = JSON.parse(JSON.stringify(d)) as PlannerConfig;
  const strip = <T extends object>(xs: T[]) => xs.map(({ _id, ...x }: T & { _id?: unknown }) => (void _id, x as T));
  return {
    columns: strip(raw.columns),
    lists: strip(raw.lists),
    tags: strip(raw.tags),
    weeklyGoal: raw.weeklyGoal,
  };
}

export function toTask(d: unknown): Task {
  const raw = JSON.parse(JSON.stringify(d)) as Record<string, unknown> & { checklist?: Task["checklist"] };
  return {
    id: String(raw._id),
    title: String(raw.title),
    notes: String(raw.notes ?? ""),
    columnId: String(raw.columnId),
    listId: String(raw.listId ?? ""),
    tags: (raw.tags as string[]) ?? [],
    priority: (raw.priority as Task["priority"]) ?? "none",
    due: (raw.due as string | null) ?? null,
    checklist: (raw.checklist ?? []).map(({ id, text, done }) => ({ id, text, done })),
    order: Number(raw.order ?? 0),
    completedAt: (raw.completedAt as string | null) ?? null,
    createdAt: String(raw.createdAt),
  };
}

export async function listTasks(): Promise<Task[]> {
  return (await TaskModel.find().sort({ order: 1, createdAt: 1 }).lean()).map(toTask);
}
