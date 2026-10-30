"use server";

import { v2 as cloudinary } from "cloudinary";
import { updateTag } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { defaultPlannerConfig } from "@/lib/admin/planner-defaults";
import {
  faqSchema,
  idSchema,
  orderSchema,
  projectSchema,
  settingsSchema,
  testimonialSchema,
  type ProjectInput,
  type SettingsInput,
} from "@/lib/admin/schemas";
import { contentTags } from "@/lib/content";
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
    await ProjectModel.deleteOne({ _id: idSchema.parse(id) });
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
    for (const k of Object.keys(data) as (keyof typeof data)[]) {
      if (data[k] === undefined) delete (merged as Record<string, unknown>)[k];
    }
    await SettingsModel.updateOne({ key: "site" }, { $set: { data: merged } }, { upsert: true });
    updateTag(contentTags.settings);
  });
}

/* ---------- Images ---------- */

const MAX_UPLOAD = 8 * 1024 * 1024;

/** Uploads one image to Cloudinary (when CLOUDINARY_URL is set) and returns its ImageRef. */
export async function uploadImage(formData: FormData) {
  return adminAction(async (): Promise<ImageRef> => {
    if (!process.env.CLOUDINARY_URL) throw new Error("Uploads need CLOUDINARY_URL. Paste an image URL instead.");
    const file = formData.get("file");
    if (!(file instanceof File) || !file.type.startsWith("image/")) throw new Error("Choose an image file.");
    if (file.size > MAX_UPLOAD) throw new Error("Images must be under 8 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const res = await cloudinary.uploader.upload(`data:${file.type};base64,${bytes.toString("base64")}`, {
      folder: "portfolio",
      resource_type: "image",
    });
    return { src: res.secure_url, alt: "", width: res.width, height: res.height };
  });
}

export async function canUpload(): Promise<boolean> {
  return Boolean(process.env.CLOUDINARY_URL);
}
