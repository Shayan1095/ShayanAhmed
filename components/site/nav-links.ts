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
