"use server";

import { z } from "zod";
import { adminAction } from "@/lib/admin/action";
import { getPlannerConfig, toTask } from "@/lib/admin/data";
import { idSchema } from "@/lib/admin/schemas";
import type { PlannerConfig, Task } from "@/lib/admin/types";
import { PlannerConfigModel, TaskModel } from "@/lib/db/models";

/**
 * Planner mutations. Completion is derived from the column: entering a
 * "done" column stamps completedAt, leaving one clears it, so the progress
 * numbers always match the board.
 */

const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .transform((v) => (v ? new Date(`${v}T00:00:00.000Z`) : null));

const taskPatch = z
  .object({
    title: z.string().trim().min(1, "Add a title").max(200),
    notes: z.string().max(5000),
    columnId: z.string().min(1).max(40),
    listId: z.string().max(40),
    tags: z.array(z.string().max(40)).max(12),
    priority: z.enum(["none", "low", "medium", "high", "urgent"]),
    due: day,
    checklist: z
      .array(z.object({ id: z.string().max(40), text: z.string().trim().min(1).max(200), done: z.boolean() }))
      .max(50),
  })
  .partial();

async function completion(columnId: string, current: Date | null) {
  const cfg = await getPlannerConfig();
  const col = cfg.columns.find((c) => c.id === columnId);
  if (!col) throw new Error("That column no longer exists.");
  return col.done ? (current ?? new Date()) : null;
}

export async function createTask(input: { title: string; columnId: string; listId?: string; due?: string | null; priority?: string }) {
  return adminAction(async (): Promise<Task> => {
    const data = taskPatch.parse({ priority: "none", listId: "", ...input });
    const columnId = data.columnId!;
    const last = await TaskModel.findOne({ columnId }).sort({ order: -1 }).select("order").lean();
    const doc = await TaskModel.create({
      ...data,
      order: (last?.order ?? 0) + 1,
      completedAt: await completion(columnId, null),
    });
    return toTask(doc.toObject());
  });
}

export async function updateTask(id: string, patch: z.input<typeof taskPatch>) {
  return adminAction(async (): Promise<Task> => {
    const data = taskPatch.parse(patch);
    const _id = idSchema.parse(id);
    const current = await TaskModel.findById(_id).select("columnId completedAt").lean();
    if (!current) throw new Error("That task no longer exists.");
    const set: Record<string, unknown> = { ...data };
    if (data.columnId && data.columnId !== current.columnId) {
      set.completedAt = await completion(data.columnId, current.completedAt ?? null);
      const last = await TaskModel.findOne({ columnId: data.columnId }).sort({ order: -1 }).select("order").lean();
      set.order = (last?.order ?? 0) + 1;
    }
    const doc = await TaskModel.findByIdAndUpdate(_id, { $set: set }, { returnDocument: "after" }).lean();
    return toTask(doc);
  });
}

/** Drops a task into a column at a position: `orderedIds` is that column's full new order. */
export async function moveTask(id: string, columnId: string, orderedIds: string[]) {
  return adminAction(async (): Promise<Task> => {
    const _id = idSchema.parse(id);
    const ids = z.array(idSchema).max(1000).parse(orderedIds);
    const current = await TaskModel.findById(_id).select("columnId completedAt").lean();
    if (!current) throw new Error("That task no longer exists.");
    const completedAt =
      current.columnId === columnId ? (current.completedAt ?? null) : await completion(columnId, current.completedAt ?? null);
    await TaskModel.updateOne({ _id }, { $set: { columnId, completedAt } });
    await TaskModel.bulkWrite(ids.map((tid, i) => ({ updateOne: { filter: { _id: tid }, update: { order: i + 1 } } })));
    return toTask(await TaskModel.findById(_id).lean());
  });
}

export async function deleteTask(id: string) {
  return adminAction(async () => {
    await TaskModel.deleteOne({ _id: idSchema.parse(id) });
  });
}

/* ---------- Customise ---------- */

const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const slugId = z.string().trim().min(1).max(40);
const configSchema = z
  .object({
    columns: z
      .array(z.object({ id: slugId, name: z.string().trim().min(1, "Name every column").max(30), color, done: z.boolean() }))
      .min(1)
      .max(10),
    lists: z.array(z.object({ id: slugId, name: z.string().trim().min(1, "Name every list").max(30), color })).max(20),
    tags: z.array(z.object({ id: slugId, name: z.string().trim().min(1, "Name every tag").max(24), color })).max(30),
    weeklyGoal: z.number().int().min(1).max(200),
  })
  .refine((c) => c.columns.some((col) => col.done), { message: "Mark at least one column as done", path: ["columns"] })
  .refine((c) => c.columns.some((col) => !col.done), { message: "Keep at least one open column", path: ["columns"] });

export async function savePlannerConfig(input: PlannerConfig) {
  return adminAction(async () => {
    const next = configSchema.parse(input);
    const prev = await getPlannerConfig();
    const keep = new Set(next.columns.map((c) => c.id));
    const fallback = next.columns.find((c) => !c.done)!.id;

    // Tasks in removed columns move to the first open column.
    const removed = prev.columns.filter((c) => !keep.has(c.id)).map((c) => c.id);
    if (removed.length) await TaskModel.updateMany({ columnId: { $in: removed } }, { $set: { columnId: fallback, completedAt: null } });

    // A column switched to or from "done" re-stamps its tasks.
    for (const col of next.columns) {
      const was = prev.columns.find((c) => c.id === col.id);
      if (was && was.done !== col.done) {
        await TaskModel.updateMany(
          { columnId: col.id },
          col.done ? [{ $set: { completedAt: { $ifNull: ["$completedAt", "$$NOW"] } } }] : { $set: { completedAt: null } },
        );
      }
    }

    // Removed lists and tags are cleared from tasks.
    const lists = new Set(next.lists.map((l) => l.id));
    const goneLists = prev.lists.filter((l) => !lists.has(l.id)).map((l) => l.id);
    if (goneLists.length) await TaskModel.updateMany({ listId: { $in: goneLists } }, { $set: { listId: "" } });
    const tags = new Set(next.tags.map((t) => t.id));
    const goneTags = prev.tags.filter((t) => !tags.has(t.id)).map((t) => t.id);
    if (goneTags.length) await TaskModel.updateMany({}, { $pull: { tags: { $in: goneTags } } });

    await PlannerConfigModel.updateOne({ key: "planner" }, { $set: next }, { upsert: true });
  });
}
