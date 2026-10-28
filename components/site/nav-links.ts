/** Main navigation. Section ids on the homepage. */
export const navLinks = [
  { id: "work", label: "Work" },
  { id: "services", label: "Services" },
  { id: "about", label: "About" },
] as const;

export type NavId = (typeof navLinks)[number]["id"];

/** Hash on the homepage, absolute link everywhere else. */
export function sectionHref(id: string, onHome: boolean) {
  return onHome ? `#${id}` : `/#${id}`;
}
