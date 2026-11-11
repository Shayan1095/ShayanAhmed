import { z } from "zod";
import { leadSources } from "./crm";

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
  width: z.number("Add the width").int().min(1, "Add the width").max(10000),
  height: z.number("Add the height").int().min(1, "Add the height").max(10000),
});
const optImage = imageRefSchema.nullish().transform((v) => v ?? undefined);
const optUrl = opt(300).pipe(z.url("Enter a full URL, starting with https://").optional());
/** A video file: a full https:// URL (e.g. Cloudinary) or a path in /public (e.g. /work/slug/clip.mp4). */
const mediaUrl = opt(600).pipe(
  z
    .string()
    .refine((v) => /^https:\/\//.test(v) || v.startsWith("/"), "Use a full https:// URL or a path starting with /")
    .optional(),
);
const videoSources = z
  .object({ mp4: mediaUrl, webm: mediaUrl })
  .nullish()
  .transform((v) => (v && (v.mp4 || v.webm) ? v : undefined));

export const projectSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Add a URL slug")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only")
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
  liveUrl: opt(300).pipe(z.url("Enter a full URL, starting with https://").optional()),
  demoNote: opt(200),
  stack: lines,
  layers: z.object({ website: lines, system: lines, automation: lines }),
  features: z.array(z.object({ title: text(80).min(1, "Name the feature, or remove the row"), text: text(400) })).max(20),
  decisions: z
    .array(z.object({ title: text(120).min(1, "Name the decision, or remove the row"), text: text(600), tradeoff: opt(400) }))
    .max(12),
  weakPoints: lines.default([]),
  proves: opt(600),
  nextSteps: lines.default([]),
  uiFragments: z
    .array(
      z.object({
        tag: text(60).min(1, "Add the source"),
        text: text(160).min(1, "Add the message"),
        actions: z.array(text(30)).max(3).optional(),
      }),
    )
    .max(6),
  agents: z
    .array(z.object({ name: text(60).min(1, "Name the agent"), status: text(60), needsYou: z.boolean().optional() }))
    .max(12),
  results: z.array(z.object({ label: text(80).min(1, "Add a label"), value: text(40).min(1, "Add the figure") })).max(8),
  // Main recording: MP4 and/or WebM (src is the older single-URL form, still accepted).
  video: z
    .object({ src: mediaUrl, mp4: mediaUrl, webm: mediaUrl, poster: opt(600), caption: opt(200) })
    .nullish()
    .transform((v) => (v && (v.src || v.mp4 || v.webm) ? v : undefined)),
  poster: optImage,
  videoCustomer: videoSources,
  videoOwner: videoSources,
  screens: z
    .array(
      z.object({
        image: imageRefSchema,
        caption: text(140).min(1, "Add a one-line caption"),
        view: z.enum(["customer", "owner"]),
      }),
    )
    .max(12)
    .default([]),
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
  // Empty or 0 means "no rating"; otherwise a whole number of stars, 1 to 5.
  rating: z
    .number()
    .int()
    .min(0)
    .max(5)
    .nullish()
    .transform((v) => (v ? v : undefined)),
  country: opt(60),
  sourceUrl: optUrl,
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
  email: opt(120).pipe(z.email("Enter a valid email address").optional()),
  linkedin: opt(300).pipe(z.url("Enter a full URL, starting with https://").optional()),
  whatsapp: opt(30).pipe(
    z
      .string()
      .regex(/^\+?[\d\s()-]{7,20}$/, "Enter the number with country code, e.g. +92 300 1234567")
      .optional(),
  ),
  socials: z
    .object({
      github: optUrl,
      instagram: optUrl,
      x: optUrl,
      facebook: optUrl,
      youtube: optUrl,
      tiktok: optUrl,
      behance: optUrl,
      dribbble: optUrl,
      upwork: optUrl,
      fiverr: optUrl,
    })
    .optional(),
  bookingUrl: opt(300).pipe(z.url("Enter a full URL, starting with https://").optional()),
  startingPrice: opt(30),
  budgetRanges: lines,
  projectTypes: lines,
  specSheet: z.array(z.object({ label: text(40).min(1, "Add a label"), value: text(120).min(1, "Add a value") })).max(12),
  portrait: optImage,
});
export type SettingsInput = z.input<typeof settingsSchema>;

export const idSchema = z.string().regex(/^[a-f0-9]{24}$/, "invalid id");
export const orderSchema = z.array(idSchema).max(500);

/** Admin: a lead added by hand (Leads → Add lead). */
export const newLeadSchema = z
  .object({
    name: z.string().trim().min(2, "Add their name").max(120),
    email: z.union([z.literal(""), z.email("Enter a valid email")]),
    phone: z.string().trim().max(40),
    company: z.string().trim().max(120),
    projectType: z.string().trim().max(120),
    source: z.enum(leadSources),
    value: z.coerce.number().min(0, "Value can't be negative").max(100_000_000),
    stage: z.enum(["new", "contacted", "proposal", "won", "lost"]),
    message: z.string().trim().max(5000),
  })
  .refine((d) => d.email || d.phone, { message: "Add an email or a phone number", path: ["email"] });

export type NewLeadInput = z.input<typeof newLeadSchema>;
