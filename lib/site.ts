/**
 * Site-wide identity and URLs. The domain comes later: until then the Vercel
 * production URL is used, and NEXT_PUBLIC_SITE_URL overrides both.
 */
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

export const site = {
  name: "Shayan Ahmed",
  role: "Full-stack developer",
  tagline: "Websites with the systems built in.",
  description:
    "Shayan Ahmed is a full-stack developer in Pakistan who builds the website your customers see, the system your team runs on, and the automations inside it.",
  locale: "en_US",
  url: resolveSiteUrl(),
  timeZone: "Asia/Karachi",
} as const;
