"use server";

import { z } from "zod";
import { adminAction } from "@/lib/admin/action";
import { toDay } from "@/lib/admin/data";
import { PlannerConfigModel, PlannerDayModel } from "@/lib/db/models";

/** Days are the viewer's local date (YYYY-MM-DD), sent by the browser. */
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid day");
const id = z.string().trim().min(1).max(40);

async function upsertDay(date: string, update: Record<string, unknown>) {
  const doc = await PlannerDayModel.findOneAndUpdate({ date }, update, { upsert: true, returnDocument: "after" }).lean();
  return toDay(doc);
}

const planPatch = z.object({
  intention: z.string().trim().max(200).optional(),
  top3: z.array(z.string().regex(/^[a-f0-9]{24}$/)).max(3).optional(),
});

/** Morning plan: the day's one intention and its top 3 tasks. */
export async function saveDayPlan(date: string, patch: z.input<typeof planPatch>) {
  return adminAction(async () => upsertDay(day.parse(date), { $set: planPatch.parse(patch) }));
}

export async function toggleHabit(date: string, habitId: string, done: boolean) {
  return adminAction(async () =>
    upsertDay(day.parse(date), done ? { $addToSet: { habits: id.parse(habitId) } } : { $pull: { habits: id.parse(habitId) } }),
  );
}

/** A finished focus session (minutes actually focused). */
export async function logFocus(date: string, minutes: number) {
  return adminAction(async () =>
    upsertDay(day.parse(date), { $inc: { focusMinutes: z.number().int().min(1).max(180).parse(minutes), focusSessions: 1 } }),
  );
}

const review = z.object({
  win: z.string().trim().max(500),
  improve: z.string().trim().max(500),
  energy: z.number().int().min(1, "Rate your energy").max(5),
});

/** Evening review: what went well, what to do better, energy 1–5. Closes the day. */
export async function saveReview(date: string, input: z.input<typeof review>) {
  return adminAction(async () => upsertDay(day.parse(date), { $set: { review: review.parse(input), reviewedAt: new Date() } }));
}

const habitsSchema = z
  .array(z.object({ id, name: z.string().trim().min(1, "Name the habit").max(40), color: z.string().regex(/^#[0-9a-f]{6}$/i) }))
  .max(8, "Up to 8 habits");

export async function saveHabits(input: z.input<typeof habitsSchema>) {
  return adminAction(async () => {
    await PlannerConfigModel.updateOne({ key: "planner" }, { $set: { habits: habitsSchema.parse(input) } }, { upsert: true });
  });
}

export async function saveRitualSettings(input: { dailyGoal?: number; focusLength?: number }) {
  return adminAction(async () => {
    const s = z
      .object({ dailyGoal: z.number().int().min(1).max(20).optional(), focusLength: z.number().int().min(5).max(90).optional() })
      .parse(input);
    await PlannerConfigModel.updateOne({ key: "planner" }, { $set: s }, { upsert: true });
  });
}
