"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { defaultPlannerConfig } from "@/lib/admin/planner-defaults";
import {
  faqSchema,
  idSchema,
  imageRefSchema,
  orderSchema,
  projectSchema,
  settingsSchema,
  testimonialSchema,
  type ProjectInput,
  type SettingsInput,
} from "@/lib/admin/schemas";
import { contentTags } from "@/lib/content";
import { hasDatabase } from "@/lib/db/connect";
import { deleteStoredImage, storeImage } from "@/lib/media";
import { projects as starterProjects } from "@/lib/content/data/projects";
import { faqs as starterFaqs, siteSettings, testimonials as starterTestimonials } from "@/lib/content/data/site";
import type { ImageRef } from "@/lib/content/types";
import {
  FaqModel,
  PlannerConfigModel,
  ProjectModel,
  SettingsModel,
  TestimonialModel,
} from "@/lib/db/models";

/**
 * Website content mutations. Each one validates on the server, writes, then
 * refreshes only the public pages that read that content (cache tags).
 */

async function setOrder(model: typeof ProjectModel | typeof FaqModel | typeof TestimonialModel, ids: string[]) {
  const ordered = orderSchema.parse(ids);
  await model.bulkWrite(ordered.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { order: i + 1 } } })));
}

/* ---------- Starter content ---------- */

/** First run only: copies the current site content into the database. */
export async function importStarterContent() {
  return adminAction(async () => {
    if (await SettingsModel.exists({ key: "site" })) throw new Error("Content is already in the database.");
    await ProjectModel.insertMany(starterProjects);
    await TestimonialModel.insertMany(starterTestimonials.map(({ id, ...t }) => (void id, t)));
    await FaqModel.insertMany(starterFaqs.map(({ id, ...f }) => (void id, f)));
    await PlannerConfigModel.updateOne({ key: "planner" }, { $setOnInsert: defaultPlannerConfig }, { upsert: true });
    // Settings last: its presence switches the public site over to the database.
    await SettingsModel.create({ key: "site", data: siteSettings });
    Object.values(contentTags).forEach((t) => updateTag(t));
  });
}

/* ---------- Projects ---------- */

export async function saveProject(id: string | null, input: ProjectInput) {
  return adminAction(async () => {
    const data = projectSchema.parse(input);
    // Unset cleared optional fields instead of storing empty values.
    const unset = Object.fromEntries(
      Object.entries(data)
        .filter(([, v]) => v === undefined)
        .map(([k]) => [k, 1]),
    );
    const set = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    let savedId = id;
    if (id) {
      await ProjectModel.updateOne({ _id: idSchema.parse(id) }, { $set: set, $unset: unset });
    } else {
      const last = await ProjectModel.findOne().sort({ order: -1 }).select("order").lean();
      const doc = await ProjectModel.create({ ...set, order: (last?.order ?? 0) + 1 });
      savedId = String(doc._id);
    }
    updateTag(contentTags.projects);
    return savedId;
  });
}

export async function patchProject(id: string, patch: { featured?: boolean; published?: boolean }) {
  return adminAction(async () => {
    const clean: Record<string, boolean> = {};
    if (typeof patch.featured === "boolean") clean.featured = patch.featured;
    if (typeof patch.published === "boolean") clean.published = patch.published;
    await ProjectModel.updateOne({ _id: idSchema.parse(id) }, { $set: clean });
    updateTag(contentTags.projects);
  });
}

export async function reorderProjects(ids: string[]) {
  return adminAction(async () => {
    await setOrder(ProjectModel, ids);
    updateTag(contentTags.projects);
  });
}

export async function deleteProject(id: string) {
  return adminAction(async () => {
    const doc = await ProjectModel.findByIdAndDelete(idSchema.parse(id)).lean();
    const screens = ((doc?.screens ?? []) as { image?: ImageRef }[]).map((s) => s.image);
    for (const img of [doc?.poster, doc?.cover, doc?.customerView, doc?.ownerView, ...screens] as (ImageRef | undefined)[]) {
      await deleteStoredImage(img?.src);
    }
    updateTag(contentTags.projects);
  });
}

/* ---------- Testimonials ---------- */

export async function saveTestimonial(id: string | null, input: unknown) {
  return adminAction(async () => {
    const data = testimonialSchema.parse(input);
    // No consent, no publishing (DESIGN.md §11). The model enforces it too.
    if (!data.consent) data.published = false;
    if (id) {
      await TestimonialModel.updateOne(
        { _id: idSchema.parse(id) },
        { $set: data, $unset: { ...(data.photo ? {} : { photo: 1 }), ...(data.projectSlug ? {} : { projectSlug: 1 }) } },
      );
    } else {
      const last = await TestimonialModel.findOne().sort({ order: -1 }).select("order").lean();
      await TestimonialModel.create({ ...data, order: (last?.order ?? 0) + 1 });
    }
    updateTag(contentTags.testimonials);
  });
}

export async function reorderTestimonials(ids: string[]) {
  return adminAction(async () => {
    await setOrder(TestimonialModel, ids);
    updateTag(contentTags.testimonials);
  });
}

export async function deleteTestimonial(id: string) {
  return adminAction(async () => {
    await TestimonialModel.deleteOne({ _id: idSchema.parse(id) });
    updateTag(contentTags.testimonials);
  });
}

/* ---------- FAQ ---------- */

export async function saveFaq(id: string | null, input: unknown) {
  return adminAction(async () => {
    const data = faqSchema.parse(input);
    if (id) {
      await FaqModel.updateOne({ _id: idSchema.parse(id) }, { $set: data });
      updateTag(contentTags.faqs);
      return id;
    }
    const last = await FaqModel.findOne().sort({ order: -1 }).select("order").lean();
    const doc = await FaqModel.create({ ...data, order: (last?.order ?? 0) + 1 });
    updateTag(contentTags.faqs);
    return String(doc._id);
  });
}

export async function reorderFaqs(ids: string[]) {
  return adminAction(async () => {
    await setOrder(FaqModel, ids);
    updateTag(contentTags.faqs);
  });
}

export async function deleteFaq(id: string) {
  return adminAction(async () => {
    await FaqModel.deleteOne({ _id: idSchema.parse(id) });
    updateTag(contentTags.faqs);
  });
}

/* ---------- Settings ---------- */

export async function saveSettings(input: SettingsInput) {
  return adminAction(async () => {
    const data = settingsSchema.parse(input);
    const current = await SettingsModel.findOne({ key: "site" }).lean();
    // Keep fields this form doesn't edit (the hero demo) as they are.
    const merged = { ...siteSettings, ...((current?.data as object) ?? {}), ...data };
    // Every field this form edits: emptied ones arrive missing, so remove them.
    for (const k of Object.keys(settingsSchema.shape) as (keyof typeof data)[]) {
      if (data[k] === undefined) delete (merged as Record<string, unknown>)[k];
    }
    await SettingsModel.updateOne({ key: "site" }, { $set: { data: merged } }, { upsert: true });
    updateTag(contentTags.settings);
  });
}

/* ---------- Images ---------- */

/** Uploads one image (Cloudinary if configured, else the database) and returns its ImageRef. */
export async function uploadImage(formData: FormData) {
  return adminAction(async (): Promise<ImageRef> => {
    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("Choose an image file.");
    return storeImage(file, { width: Number(formData.get("width")), height: Number(formData.get("height")) });
  });
}

export async function canUpload(): Promise<boolean> {
  return hasDatabase() || Boolean(process.env.CLOUDINARY_URL);
}

const slotSchema = z.enum(["cover", "customerView", "ownerView"]);

/** Sets or clears one project image (Screenshots tab); a replaced upload is deleted. */
export async function setProjectImage(id: string, slot: z.input<typeof slotSchema>, image: ImageRef | null) {
  return adminAction(async () => {
    const key = slotSchema.parse(slot);
    const _id = idSchema.parse(id);
    const next = image ? imageRefSchema.parse(image) : null;
    const current = await ProjectModel.findById(_id).select(key).lean();
    if (!current) throw new Error("That project no longer exists.");
    const prev = (current as Record<string, unknown>)[key] as ImageRef | undefined;
    await ProjectModel.updateOne({ _id }, next ? { $set: { [key]: next } } : { $unset: { [key]: 1 } });
    if (prev?.src && prev.src !== next?.src) await deleteStoredImage(prev.src);
    updateTag(contentTags.projects);
  });
}
