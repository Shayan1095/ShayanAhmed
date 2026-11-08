import type { SiteSettings } from "./types";

/**
 * Social platforms the footer can show as keycaps. Each key carries a short
 * legend, like a real keyboard, instead of another company's logo.
 * Order here is the order on the page.
 */
export const SOCIAL_PLATFORMS = [
  { key: "github", label: "GitHub", legend: "GH", placeholder: "https://github.com/…" },
  { key: "instagram", label: "Instagram", legend: "IG", placeholder: "https://instagram.com/…" },
  { key: "x", label: "X", legend: "X", placeholder: "https://x.com/…" },
  { key: "facebook", label: "Facebook", legend: "fb", placeholder: "https://facebook.com/…" },
  { key: "youtube", label: "YouTube", legend: "YT", placeholder: "https://youtube.com/@…" },
  { key: "tiktok", label: "TikTok", legend: "TT", placeholder: "https://tiktok.com/@…" },
  { key: "behance", label: "Behance", legend: "Bē", placeholder: "https://behance.net/…" },
  { key: "dribbble", label: "Dribbble", legend: "Dr", placeholder: "https://dribbble.com/…" },
  { key: "upwork", label: "Upwork", legend: "Up", placeholder: "https://upwork.com/freelancers/…" },
  { key: "fiverr", label: "Fiverr", legend: "fi", placeholder: "https://fiverr.com/…" },
] as const;

export type SocialKey = (typeof SOCIAL_PLATFORMS)[number]["key"];

export type SocialLink = {
  key: string;
  label: string;
  legend: string;
  href: string;
  external: boolean;
  /** Development-only stand-in (no real profile yet): shown, but not a link. */
  preview?: boolean;
};

/** Profile links without the tracking tails share sheets add (?igsh=, utm_…). */
function cleanProfileUrl(href: string) {
  try {
    const u = new URL(href);
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return href;
  }
}

/**
 * Stand-in profiles for previewing the social orbit in development before
 * any real links are saved (never shown in production).
 */
const PREVIEW_SOCIALS: SocialLink[] = [
  { key: "instagram", label: "Instagram", legend: "IG", href: "#", external: true },
  { key: "linkedin", label: "LinkedIn", legend: "in", href: "#", external: true },
  { key: "facebook", label: "Facebook", legend: "fb", href: "#", external: true },
  { key: "github", label: "GitHub", legend: "GH", href: "#", external: true },
  { key: "x", label: "X", legend: "X", href: "#", external: true },
  { key: "youtube", label: "YouTube", legend: "YT", href: "#", external: true },
  { key: "whatsapp", label: "WhatsApp", legend: "WA", href: "#", external: true },
  { key: "email", label: "Email", legend: "@", href: "#", external: false },
];

/**
 * The orbit's links. In development, platforms without a saved profile are
 * filled in with stand-ins so the full orbit can be previewed; in production
 * only real profiles show.
 */
export function orbitLinks(real: SocialLink[], dev: boolean): SocialLink[] {
  if (!dev) return real;
  const have = new Set(real.map((l) => l.key));
  const order = PREVIEW_SOCIALS.map((l) => l.key);
  return [...real, ...PREVIEW_SOCIALS.filter((l) => !have.has(l.key)).map((l) => ({ ...l, preview: true }))].sort(
    (a, b) => order.indexOf(a.key) - order.indexOf(b.key),
  );
}

/** "+92 300 1234567" → "923001234567" for wa.me links. */
export function whatsappHref(number?: string) {
  const digits = number?.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : undefined;
}

/** Every way to reach Shayan that is filled in, as keycaps: LinkedIn, the socials, WhatsApp, email. */
export function socialLinks(settings: Pick<SiteSettings, "linkedin" | "socials" | "whatsapp" | "email">): SocialLink[] {
  const out: SocialLink[] = [];
  if (settings.linkedin) out.push({ key: "linkedin", label: "LinkedIn", legend: "in", href: cleanProfileUrl(settings.linkedin), external: true });
  for (const p of SOCIAL_PLATFORMS) {
    const href = settings.socials?.[p.key];
    if (href) out.push({ key: p.key, label: p.label, legend: p.legend, href: cleanProfileUrl(href), external: true });
  }
  const wa = whatsappHref(settings.whatsapp);
  if (wa) out.push({ key: "whatsapp", label: "WhatsApp", legend: "WA", href: wa, external: true });
  if (settings.email) out.push({ key: "email", label: "Email", legend: "@", href: `mailto:${settings.email}`, external: false });
  return out;
}
