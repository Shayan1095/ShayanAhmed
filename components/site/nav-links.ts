import type { ImageRef, Project } from "@/lib/content/types";

/** Main navigation. Section ids on the homepage. */
export const navLinks = [
  { id: "work", label: "Work" },
  { id: "services", label: "Services" },
  { id: "process", label: "Process" },
  { id: "about", label: "About" },
] as const;

export type NavId = (typeof navLinks)[number]["id"];

/** Every homepage chapter the navbar can name in its "you are here" readout, in page order. */
export const chapters = [
  { id: "work", label: "Selected work" },
  { id: "services", label: "Services" },
  { id: "archive", label: "Archive" },
  { id: "process", label: "Process" },
  { id: "about", label: "About" },
  { id: "faq", label: "Questions" },
  { id: "contact", label: "Contact" },
] as const;

export type ChapterId = (typeof chapters)[number]["id"];

/** Hash on the homepage, absolute link everywhere else. */
export function sectionHref(id: string, onHome: boolean) {
  return onHome ? `#${id}` : `/#${id}`;
}

/** What the navbar's Work preview and the phone menu need about a featured project. */
export type NavProject = {
  slug: string;
  title: string;
  /** One line: the outcome if there is one, else the kind of build. */
  line: string;
  href: string;
  image?: ImageRef;
  monitorLabel?: string;
};

export function toNavProjects(projects: Project[]): NavProject[] {
  return projects.slice(0, 2).map((p) => ({
    slug: p.slug,
    title: p.title,
    line: p.outcome || p.kind || p.summary,
    href: p.hasCaseStudy ? `/work/${p.slug}` : "/work",
    image: p.customerView ?? p.cover,
    monitorLabel: p.monitorLabel,
  }));
}
