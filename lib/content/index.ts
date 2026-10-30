import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connectDb } from "@/lib/db/connect";
import { FaqModel, ProjectModel, SettingsModel, TestimonialModel } from "@/lib/db/models";
import { projects as starterProjects } from "./data/projects";
import { faqs as starterFaqs, siteSettings as starterSettings, testimonials as starterTestimonials } from "./data/site";
import type { Faq, Project, SiteSettings, Testimonial } from "./types";

/**
 * Content getters. They read MongoDB once the admin has imported content
 * (the Settings document exists); before that, or if the database can't be
 * reached, they serve the starter content in ./data so the site never breaks.
 * Each is cached and tagged; admin saves call updateTag on the same tag.
 */

export const contentTags = {
  projects: "projects",
  testimonials: "testimonials",
  faqs: "faqs",
  settings: "settings",
} as const;

/** Plain JSON: drops ObjectIds, Dates and Mongo bookkeeping fields. */
function plain<T>(doc: unknown): T {
  const { _id, __v, createdAt, updatedAt, ...rest } = JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;
  void __v;
  void createdAt;
  void updatedAt;
  return { id: String(_id), ...rest } as T;
}

/** Runs a database read, or returns null to use the starter content. */
async function fromDb<T>(read: () => Promise<T>): Promise<T | null> {
  try {
    if (!(await connectDb())) return null;
    if (!(await SettingsModel.exists({ key: "site" }))) return null;
    return await read();
  } catch (err) {
    console.error("[content] database read failed, serving starter content:", err);
    return null;
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("days");
  cacheTag(contentTags.settings);
  const db = await fromDb(async () => {
    const doc = await SettingsModel.findOne({ key: "site" }).lean();
    return doc ? ({ ...starterSettings, ...(doc.data as Partial<SiteSettings>) } as SiteSettings) : null;
  });
  return db ?? starterSettings;
}

export async function getProjects(): Promise<Project[]> {
  "use cache";
  cacheLife("days");
  cacheTag(contentTags.projects);
  const db = await fromDb(async () =>
    (await ProjectModel.find({ published: true }).sort({ order: 1 }).lean()).map((d) => {
      const { id, ...p } = plain<Project & { id: string }>(d);
      void id;
      return p as Project;
    }),
  );
  return db ?? starterProjects.filter((p) => p.published).sort((a, b) => a.order - b.order);
}

export async function getFeaturedProjects(): Promise<Project[]> {
  return (await getProjects()).filter((p) => p.featured);
}

export async function getArchiveProjects(): Promise<Project[]> {
  return (await getProjects()).filter((p) => !p.featured);
}

export async function getProject(slug: string): Promise<Project | undefined> {
  return (await getProjects()).find((p) => p.slug === slug);
}

export async function getTestimonials(): Promise<Testimonial[]> {
  "use cache";
  cacheLife("days");
  cacheTag(contentTags.testimonials);
  // Consent is required to publish (DESIGN.md §11).
  const db = await fromDb(async () =>
    (await TestimonialModel.find({ published: true, consent: true }).sort({ order: 1 }).lean()).map((d) =>
      plain<Testimonial>(d),
    ),
  );
  return db ?? starterTestimonials.filter((t) => t.published && t.consent).sort((a, b) => a.order - b.order);
}

export async function getFaqs(): Promise<Faq[]> {
  "use cache";
  cacheLife("days");
  cacheTag(contentTags.faqs);
  const db = await fromDb(async () =>
    (await FaqModel.find({ published: true }).sort({ order: 1 }).lean()).map((d) => plain<Faq>(d)),
  );
  return (db ?? starterFaqs.filter((f) => f.published).sort((a, b) => a.order - b.order)).filter((f) =>
    f.answer.trim(),
  );
}

export { plain };
export type { DemoDecision, Faq, ImageRef, Project, SiteSettings, Testimonial, UiFragmentData } from "./types";
