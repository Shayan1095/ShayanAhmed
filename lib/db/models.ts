import "server-only";
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Mongoose models (DESIGN.md §11 plus the planner). Nested content blocks are
 * stored as plain objects: zod validates their shape in the admin actions,
 * and lib/content/types.ts is the single description of it.
 */

const { Mixed } = Schema.Types;
const opts = { timestamps: true, minimize: false } as const;

function model<T>(name: string, schema: Schema<T>): Model<T> {
  // Reuse the compiled model across dev reloads.
  return (mongoose.models[name] as Model<T>) ?? mongoose.model<T>(name, schema);
}

/* ---------- Public content ---------- */

const projectSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: ["website", "system", "automation", "web-tool"], required: true },
    status: { type: String, enum: ["client", "product", "confidential"], required: true },
    statusLabel: String,
    kind: { type: String, default: "" },
    summary: { type: String, default: "" },
    problem: String,
    client: String,
    role: String,
    timeline: String,
    outcome: String,
    fact: { type: String, default: "" },
    monitorLabel: String,
    liveUrl: String,
    demoNote: String,
    stack: { type: [String], default: [] },
    layers: { type: Mixed, default: () => ({ website: [], system: [], automation: [] }) },
    features: { type: Mixed, default: () => [] },
    decisions: { type: Mixed, default: () => [] },
    uiFragments: { type: Mixed, default: () => [] },
    agents: { type: Mixed, default: () => [] },
    results: { type: Mixed, default: () => [] },
    video: Mixed,
    cover: Mixed,
    customerView: Mixed,
    ownerView: Mixed,
    gallery: { type: Mixed, default: () => [] },
    featured: { type: Boolean, default: false },
    hasCaseStudy: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
  },
  opts,
);

const testimonialSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "" },
    company: { type: String, default: "" },
    photo: Mixed,
    quote: { type: String, required: true },
    projectSlug: String,
    consent: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  opts,
);
// Publishing without the client's consent is never allowed (DESIGN.md §11).
testimonialSchema.pre("validate", function () {
  if (this.published && !this.consent) this.published = false;
});

const faqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, default: "" },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
  },
  opts,
);

/** Single document (key "site") holding SiteSettings. */
const settingsSchema = new Schema(
  {
    key: { type: String, default: "site", unique: true },
    data: { type: Mixed, required: true },
  },
  opts,
);

/* ---------- Inbox ---------- */

const inquirySchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    projectType: { type: String, default: "" },
    budget: { type: String, default: "" },
    message: { type: String, required: true },
    status: { type: String, enum: ["new", "read", "replied", "archived"], default: "new", index: true },
    emailed: { type: Boolean, default: false },
  },
  opts,
);

/** Fixed-window counter; Mongo deletes each row when it expires. */
const rateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
});

/* ---------- Planner ---------- */

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    notes: { type: String, default: "" },
    columnId: { type: String, required: true, index: true },
    listId: { type: String, default: "" },
    tags: { type: [String], default: [] },
    priority: { type: String, enum: ["none", "low", "medium", "high", "urgent"], default: "none" },
    due: { type: Date, default: null },
    checklist: { type: [{ id: String, text: String, done: Boolean }], default: [] },
    order: { type: Number, default: 0 },
    /** Set when the task enters a "done" column, cleared when it leaves. */
    completedAt: { type: Date, default: null, index: true },
  },
  opts,
);

/** Single document (key "planner"): columns, lists, tags and the weekly goal. */
const plannerConfigSchema = new Schema(
  {
    key: { type: String, default: "planner", unique: true },
    columns: { type: [{ id: String, name: String, color: String, done: Boolean }], default: [] },
    lists: { type: [{ id: String, name: String, color: String }], default: [] },
    tags: { type: [{ id: String, name: String, color: String }], default: [] },
    weeklyGoal: { type: Number, default: 10 },
  },
  opts,
);

export const ProjectModel = model("Project", projectSchema);
export const TestimonialModel = model("Testimonial", testimonialSchema);
export const FaqModel = model("Faq", faqSchema);
export const SettingsModel = model("Settings", settingsSchema);
export const InquiryModel = model("Inquiry", inquirySchema);
export const RateLimitModel = model("RateLimit", rateLimitSchema);
export const TaskModel = model("Task", taskSchema);
export const PlannerConfigModel = model("PlannerConfig", plannerConfigSchema);

export type InquiryDoc = InferSchemaType<typeof inquirySchema> & { _id: mongoose.Types.ObjectId };
export type TaskDoc = InferSchemaType<typeof taskSchema> & { _id: mongoose.Types.ObjectId };
