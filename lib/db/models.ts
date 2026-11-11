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
    poster: Mixed,
    videoCustomer: Mixed,
    videoOwner: Mixed,
    screens: { type: Mixed, default: () => [] },
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
    // Contact-form leads always have one; manual leads may have a phone instead.
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    company: { type: String, default: "" },
    projectType: { type: String, default: "" },
    budget: { type: String, default: "" },
    message: { type: String, default: "" },
    status: { type: String, enum: ["new", "read", "replied", "archived"], default: "new", index: true },
    emailed: { type: Boolean, default: false },
    /* CRM: where the lead is in the sales pipeline, and what it's worth. */
    source: { type: String, default: "website" },
    stage: { type: String, enum: ["new", "contacted", "proposal", "won", "lost"], default: "new", index: true },
    value: { type: Number, default: 0, min: 0 },
    /** YYYY-MM-DD at UTC midnight, like planner due dates. */
    followUpAt: { type: Date, default: null },
    firstReplyAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    activity: {
      type: [
        new Schema(
          {
            kind: { type: String, enum: ["stage", "note", "followup", "value", "email", "created"], required: true },
            text: { type: String, required: true, maxlength: 4000 },
            at: { type: Date, default: Date.now },
          },
          { _id: true },
        ),
      ],
      default: [],
    },
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
    /** Today page: tasks to finish for a day to count towards the streak. */
    dailyGoal: { type: Number, default: 3 },
    /** Today page: daily habits (checked per day on PlannerDay). */
    habits: { type: [{ id: String, name: String, color: String }], default: undefined },
    /** Focus timer length in minutes. */
    focusLength: { type: Number, default: 25 },
  },
  opts,
);

/** One document per local day (YYYY-MM-DD): the morning plan, habits, focus time and the evening review. */
const plannerDaySchema = new Schema(
  {
    date: { type: String, required: true, unique: true },
    intention: { type: String, default: "" },
    top3: { type: [String], default: [] },
    habits: { type: [String], default: [] },
    focusMinutes: { type: Number, default: 0 },
    focusSessions: { type: Number, default: 0 },
    review: {
      win: { type: String, default: "" },
      improve: { type: String, default: "" },
      energy: { type: Number, default: 0 },
    },
    reviewedAt: { type: Date, default: null },
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
export const PlannerDayModel = model("PlannerDay", plannerDaySchema);

export type InquiryDoc = InferSchemaType<typeof inquirySchema> & { _id: mongoose.Types.ObjectId };
export type TaskDoc = InferSchemaType<typeof taskSchema> & { _id: mongoose.Types.ObjectId };
