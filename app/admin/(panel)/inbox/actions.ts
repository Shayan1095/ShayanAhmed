"use server";

import { z } from "zod";
import { adminAction } from "@/lib/admin/action";
import { money, stageLabel } from "@/lib/admin/crm";
import { toInquiry } from "@/lib/admin/data";
import { idSchema, newLeadSchema, type NewLeadInput } from "@/lib/admin/schemas";
import type { Inquiry } from "@/lib/admin/types";
import { InquiryModel } from "@/lib/db/models";

const status = z.enum(["new", "read", "replied", "archived"]);
const stage = z.enum(["new", "contacted", "proposal", "won", "lost"]);
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
  .nullable();

type Update = { $set: Record<string, unknown>; $push?: { activity: { $each: { kind: string; text: string; at: Date }[] } } };

async function save(id: string, update: Update): Promise<Inquiry> {
  const doc = await InquiryModel.findByIdAndUpdate(idSchema.parse(id), update, { returnDocument: "after" }).lean();
  if (!doc) throw new Error("This lead no longer exists.");
  return toInquiry(doc);
}

export async function setInquiryStatus(id: string, next: z.input<typeof status>) {
  return adminAction(async () => {
    const s = status.parse(next);
    const cur = await InquiryModel.findById(idSchema.parse(id)).lean();
    if (!cur) throw new Error("This lead no longer exists.");
    const update: Update = { $set: { status: s } };
    // Replying moves a new lead into "Contacted" and starts the response-time clock.
    if (s === "replied") {
      if (!cur.firstReplyAt) update.$set.firstReplyAt = new Date();
      if ((cur.stage ?? "new") === "new") {
        update.$set.stage = "contacted";
        update.$push = { activity: { $each: [{ kind: "email", text: "Replied · moved to Contacted", at: new Date() }] } };
      }
    }
    return save(id, update);
  });
}

const leadPatch = z.object({
  stage: stage.optional(),
  value: z.coerce.number().min(0, "Value can't be negative").max(100_000_000).optional(),
  followUpAt: day.optional(),
  company: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
});

/** Pipeline edits from the lead panel or the board; each change is logged on the lead's timeline. */
export async function updateLead(id: string, patch: z.input<typeof leadPatch>) {
  return adminAction(async () => {
    const p = leadPatch.parse(patch);
    const cur = await InquiryModel.findById(idSchema.parse(id)).lean();
    if (!cur) throw new Error("This lead no longer exists.");
    const now = new Date();
    const $set: Record<string, unknown> = {};
    const log: { kind: string; text: string; at: Date }[] = [];
    const curStage = (cur.stage ?? (cur.status === "replied" ? "contacted" : "new")) as Inquiry["stage"];

    if (p.stage && p.stage !== curStage) {
      $set.stage = p.stage;
      log.push({ kind: "stage", text: `${stageLabel[curStage]} → ${stageLabel[p.stage]}`, at: now });
      if (p.stage !== "new" && !cur.firstReplyAt) $set.firstReplyAt = now;
      if (p.stage !== "new" && (cur.status === "new" || cur.status === "read")) $set.status = "replied";
      $set.closedAt = p.stage === "won" || p.stage === "lost" ? now : null;
      // A closed deal needs no follow-up.
      if (p.stage === "won" || p.stage === "lost") $set.followUpAt = null;
    }
    if (p.value !== undefined && p.value !== (cur.value ?? 0)) {
      $set.value = p.value;
      log.push({ kind: "value", text: p.value ? `Value set to ${money(p.value)}` : "Value cleared", at: now });
    }
    if (p.followUpAt !== undefined) {
      const next = p.followUpAt ? new Date(`${p.followUpAt}T00:00:00.000Z`) : null;
      const prev = cur.followUpAt ? new Date(cur.followUpAt).toISOString().slice(0, 10) : null;
      if ((p.followUpAt ?? null) !== prev) {
        $set.followUpAt = next;
        log.push({ kind: "followup", text: next ? `Follow-up set for ${p.followUpAt}` : "Follow-up cleared", at: now });
      }
    }
    if (p.company !== undefined) $set.company = p.company;
    if (p.phone !== undefined) $set.phone = p.phone;

    return save(id, { $set, ...(log.length ? { $push: { activity: { $each: log } } } : {}) });
  });
}

const note = z.string().trim().min(1, "Write something first").max(4000);

export async function addLeadNote(id: string, text: string) {
  return adminAction(async () =>
    save(id, { $set: {}, $push: { activity: { $each: [{ kind: "note", text: note.parse(text), at: new Date() }] } } }),
  );
}

/** Leads that didn't come through the form: WhatsApp, LinkedIn, referrals. */
export async function createLead(input: NewLeadInput) {
  return adminAction(async () => {
    const d = newLeadSchema.parse(input);
    const now = new Date();
    const doc = await InquiryModel.create({
      ...d,
      status: d.stage === "new" ? "read" : "replied",
      emailed: true, // nothing to notify: you added it
      firstReplyAt: d.stage === "new" ? null : now,
      closedAt: d.stage === "won" || d.stage === "lost" ? now : null,
      activity: [{ kind: "created", text: "Added by hand", at: now }],
    });
    return toInquiry(doc.toObject());
  });
}

export async function deleteInquiry(id: string) {
  return adminAction(async () => {
    await InquiryModel.deleteOne({ _id: idSchema.parse(id) });
  });
}
