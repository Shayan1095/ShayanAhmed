/**
 * Content types. These mirror the Mongoose models in DESIGN.md §11 so the
 * static data in lib/content/data can be swapped for database reads without
 * touching any component. Fields marked "extension" are additions to §11.
 */

/** An image. Local path for now; a Cloudinary URL once the admin panel exists. */
export type ImageRef = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type ProjectCategory = "website" | "system" | "automation" | "web-tool";
export type ProjectStatus = "client" | "product" | "confidential";

export type UiFragmentData = {
  tag: string;
  text: string;
  /** extension: decorative action keys, e.g. ["Approve", "Skip"]. */
  actions?: string[];
};

export type Project = {
  slug: string;
  title: string;
  category: ProjectCategory;
  status: ProjectStatus;
  /** extension: badge text override, e.g. "Product build". */
  statusLabel?: string;
  /** extension: short kind line, e.g. "Management system" or "E-commerce + operations". */
  kind: string;
  summary: string;
  problem?: string;
  layers: { website: string[]; system: string[]; automation: string[] };
  features: { title: string; text: string }[];
  stack: string[];
  liveUrl?: string;
  demoNote?: string;
  cover?: ImageRef;
  gallery: ImageRef[];
  customerView?: ImageRef;
  ownerView?: ImageRef;
  uiFragments: UiFragmentData[];
  /** extension: one fact shown on the archive cartridge's mini screen. */
  fact: string;
  /** extension: label on the monitor bar, e.g. "brandsattire · storefront". */
  monitorLabel?: string;
  /** extension: code-built owner dashboard (example data) when there is no ownerView screenshot. */
  agents?: { name: string; status: string; needsYou?: boolean }[];
  results?: { label: string; value: string }[];
  featured: boolean;
  /** extension: true when a case study page exists for this project. */
  hasCaseStudy: boolean;
  order: number;
  published: boolean;
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  company: string;
  photo?: ImageRef;
  quote: string;
  projectSlug?: string;
  consent: boolean;
  published: boolean;
  order: number;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  order: number;
  published: boolean;
};

/** One decision in the hero demo: an agent prepares it, the visitor makes the call. */
export type DemoDecision = {
  /** Agent tag, e.g. "Risk guard". */
  agent: string;
  /** What happened, e.g. "Order #1042 flagged: duplicate address". */
  title: string;
  /** Why it needs the owner. */
  detail: string;
  actions: { label: string; result: string; primary?: boolean }[];
};

export type SiteSettings = {
  /** Shown beside the status light, e.g. "Booking for December". */
  availability: string;
  email?: string;
  linkedin?: string;
  /** About section spec sheet. Only true values. */
  specSheet: { label: string; value: string }[];
  /** extension: the hero's operations demo (labelled as a demo of the Brands Attire build). */
  heroDemo: {
    /** Which build the demo is modelled on, shown on the screen. */
    source: string;
    decisions: DemoDecision[];
    /** Routine work agents finish on their own while the visitor decides. */
    routine: { agent: string; text: string }[];
  };
  /** extension: contact form budget options. Hidden while empty. */
  budgetRanges: string[];
  /** extension: contact form project types. */
  projectTypes: string[];
  /** extension: portrait for About and the hero chip. */
  portrait?: ImageRef;
};
