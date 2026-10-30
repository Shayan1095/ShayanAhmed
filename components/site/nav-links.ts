/** Main navigation. Section ids on the homepage; numbers match each section's label. */
export const navLinks = [
  { id: "work", n: "01", label: "Work" },
  { id: "services", n: "02", label: "Services" },
  { id: "process", n: "04", label: "Process" },
  { id: "about", n: "05", label: "About" },
] as const;

export type NavId = (typeof navLinks)[number]["id"];

/** Every homepage chapter the navbar can name in its "you are here" readout, in page order. */
export const chapters = [
  { id: "work", label: "01 · Selected work" },
  { id: "services", label: "02 · Services" },
  { id: "archive", label: "03 · Archive" },
  { id: "process", label: "04 · Process" },
  { id: "about", label: "05 · About" },
  { id: "faq", label: "07 · Questions" },
  { id: "contact", label: "08 · Contact" },
] as const;

export type ChapterId = (typeof chapters)[number]["id"];

/** Hash on the homepage, absolute link everywhere else. */
export function sectionHref(id: string, onHome: boolean) {
  return onHome ? `#${id}` : `/#${id}`;
}
