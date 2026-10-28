import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { projects } from "./data/projects";
import { faqs, siteSettings, testimonials } from "./data/site";
import type { Faq, Project, SiteSettings, Testimonial } from "./types";

/**
 * Content getters. Today they read static data; in the admin step they read
 * MongoDB. Each is cached and tagged, so an admin save can refresh exactly the
 * pages that use it (updateTag / revalidateTag on the same tag).
 */

export const contentTags = {
  projects: "projects",
  testimonials: "testimonials",
  faqs: "faqs",
  settings: "settings",
} as const;

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("days");
  cacheTag(contentTags.settings);
  return siteSettings;
}

export async function getProjects(): Promise<Project[]> {
  "use cache";
  cacheLife("days");
  cacheTag(contentTags.projects);
  return projects.filter((p) => p.published).sort((a, b) => a.order - b.order);
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
  return testimonials.filter((t) => t.published && t.consent).sort((a, b) => a.order - b.order);
}

export async function getFaqs(): Promise<Faq[]> {
  "use cache";
  cacheLife("days");
  cacheTag(contentTags.faqs);
  return faqs.filter((f) => f.published && f.answer.trim()).sort((a, b) => a.order - b.order);
}

export type { Faq, ImageRef, Project, SiteSettings, Testimonial, UiFragmentData } from "./types";
