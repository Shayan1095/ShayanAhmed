import type { Faq, SiteSettings, Testimonial } from "@/lib/content/types";
import type { ProjectRow } from "./data";

export type HealthCheck = { id: string; ok: boolean; label: string; fix: string; href: string };

/**
 * What the public site is still missing, in the order it costs you clients.
 * Each item links to the screen that fixes it.
 */
export function contentHealth(projects: ProjectRow[], testimonials: Testimonial[], faqs: Faq[], s: SiteSettings): HealthCheck[] {
  const live = projects.filter((p) => p.published);
  const noShot = live.filter((p) => !p.poster && !p.cover && !p.customerView && p.gallery.length === 0 && !p.screens?.length);
  const proof = testimonials.filter((t) => t.published && t.consent).length;
  const unanswered = faqs.filter((f) => f.published && !f.answer.trim()).length;
  return [
    {
      id: "screens",
      ok: noShot.length === 0,
      label: "Every live project has a screenshot",
      fix: `${noShot.length} without one`,
      href: "/admin/projects/screenshots",
    },
    { id: "proof", ok: proof > 0, label: "At least one testimonial is live", fix: "None yet: social proof converts", href: "/admin/testimonials" },
    { id: "email", ok: Boolean(s.email), label: "Contact email is set", fix: "Add it in Settings", href: "/admin/settings" },
    { id: "portrait", ok: Boolean(s.portrait), label: "Portrait photo is uploaded", fix: "Clients trust a face", href: "/admin/settings" },
    { id: "booking", ok: Boolean(s.bookingUrl), label: "Booking link is set", fix: "Lets clients book a call", href: "/admin/settings" },
    { id: "price", ok: Boolean(s.startingPrice), label: "Starting price is shown", fix: "Filters out poor-fit leads", href: "/admin/settings" },
    { id: "budget", ok: s.budgetRanges.length > 0, label: "Contact form asks for a budget", fix: "Add budget ranges", href: "/admin/settings" },
    { id: "faq", ok: unanswered === 0, label: "Every FAQ has an answer", fix: `${unanswered} unanswered`, href: "/admin/faq" },
    { id: "linkedin", ok: Boolean(s.linkedin), label: "LinkedIn is linked", fix: "Add it in Settings", href: "/admin/settings" },
  ];
}
