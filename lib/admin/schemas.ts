import { z } from "zod";

/** zod shapes for admin input. They mirror lib/content/types.ts. */

/** Optional text: trimmed; empty (or null from the database) becomes undefined so the site hides it. */
const opt = (max = 300) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || undefined);
const text = (max = 300) => z.string().trim().max(max);
const lines = z.array(z.string().trim().min(1).max(160)).max(40);

export const imageRefSchema = z.object({
  src: z.string().trim().min(1, "Add an image URL").max(600),
  alt: text(200),
  width: z.number().int().min(1).max(10000),
  height: z.number().int().min(1).max(10000),
});
const optImage = imageRefSchema.nullish().transform((v) => v ?? undefined);

export const projectSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use lowercase letters, numbers and dashes")
    .max(80),
  title: text(120).min(1, "Add a title"),
  category: z.enum(["website", "system", "automation", "web-tool"]),
  status: z.enum(["client", "product", "confidential"]),
  statusLabel: opt(40),
  kind: text(80),
  summary: text(600),
  problem: opt(1200),
  client: opt(120),
  role: opt(120),
  timeline: opt(80),
  outcome: opt(200),
  fact: text(120),
  monitorLabel: opt(80),
  liveUrl: opt(300).pipe(z.url().optional()),
  demoNote: opt(200),
  stack: lines,
  layers: z.object({ website: lines, system: lines, automation: lines }),
  features: z.array(z.object({ title: text(80).min(1), text: text(400) })).max(20),
  decisions: z.array(z.object({ title: text(120).min(1), text: text(600) })).max(12),
  uiFragments: z
    .array(z.object({ tag: text(60).min(1), text: text(160).min(1), actions: z.array(text(30)).max(3).optional() }))
    .max(6),
  agents: z
    .array(z.object({ name: text(60).min(1), status: text(60), needsYou: z.boolean().optional() }))
    .max(12),
  results: z.array(z.object({ label: text(80).min(1), value: text(40).min(1) })).max(8),
  video: z
    .object({ src: text(600).min(1), poster: opt(600), caption: opt(200) })
    .nullish()
    .transform((v) => v ?? undefined),
  cover: optImage,
  customerView: optImage,
  ownerView: optImage,
  gallery: z.array(imageRefSchema).max(16),
  featured: z.boolean(),
  hasCaseStudy: z.boolean(),
  published: z.boolean(),
});
export type ProjectInput = z.input<typeof projectSchema>;

export const testimonialSchema = z.object({
  name: text(80).min(1, "Add a name"),
  role: text(80),
  company: text(80),
  quote: text(800).min(1, "Add the quote"),
  projectSlug: opt(80),
  photo: optImage,
  consent: z.boolean(),
  published: z.boolean(),
});

export const faqSchema = z.object({
  question: text(200).min(1, "Add the question"),
  answer: text(1500),
  published: z.boolean(),
});

export const settingsSchema = z.object({
  availability: text(60).min(1, "Add an availability line"),
  email: opt(120).pipe(z.email().optional()),
  linkedin: opt(300).pipe(z.url().optional()),
  bookingUrl: opt(300).pipe(z.url().optional()),
  startingPrice: opt(30),
  budgetRanges: lines,
  projectTypes: lines,
  specSheet: z.array(z.object({ label: text(40).min(1), value: text(120).min(1) })).max(12),
  portrait: optImage,
});
export type SettingsInput = z.input<typeof settingsSchema>;

export const idSchema = z.string().regex(/^[a-f0-9]{24}$/, "invalid id");
export const orderSchema = z.array(idSchema).max(500);
