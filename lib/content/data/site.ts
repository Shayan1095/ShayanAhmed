import type { Faq, SiteSettings, Testimonial } from "../types";

/**
 * Site settings. Anything still missing is left empty and its UI stays hidden:
 *  - email, linkedin: contact lines
 *  - budgetRanges: the contact form's budget field
 *  - specSheet "Shipped": number of projects
 *  - portrait: About frame and hero chip
 */
export const siteSettings: SiteSettings = {
  availability: "Taking new projects",
  email: undefined,
  linkedin: undefined,
  specSheet: [
    { label: "Role", value: "Full-stack developer" },
    { label: "Stack", value: "Next.js · React · Node.js · MongoDB" },
    { label: "Based in", value: "Pakistan" },
    { label: "Time zone", value: "GMT+5 (PKT)" },
    { label: "Languages", value: "English, Urdu" },
    { label: "Experience", value: "AI team at a software company" },
  ],
  // Illustrative events from the Brands Attire and SKY Tech builds, shown on the hero slab.
  heroCaptionEvents: [
    { channel: "orders", tag: "Order", text: "#1042 flagged, owner notified" },
    { channel: "site", tag: "Site", text: "New enquiry from the contact form" },
    { channel: "orders", tag: "Remind", text: "Cart reminder sent with a code" },
    { channel: "leads", tag: "Lead", text: "Follow-up sent to 12 leads" },
    { channel: "orders", tag: "Order", text: "#1051 dispatched in one click" },
    { channel: "site", tag: "Site", text: "Checkout completed: #1058" },
    { channel: "orders", tag: "Stock", text: "3 items low, restock drafted" },
    { channel: "leads", tag: "Lead", text: "Welcome email sent to prospect" },
    { channel: "orders", tag: "Return", text: "Return triaged for approval" },
    { channel: "leads", tag: "Lead", text: "Query answered from template" },
    { channel: "orders", tag: "Brief", text: "Daily briefing ready for owner" },
  ],
  budgetRanges: [],
  projectTypes: [
    "Website or landing page",
    "Web app or management system",
    "Automation or agents",
    "Not sure yet",
  ],
  portrait: undefined,
};

/** Published only with the client's consent. Empty = section not rendered. */
export const testimonials: Testimonial[] = [];

/** FAQ. Unpublished entries are waiting for Shayan's real answers. */
export const faqs: Faq[] = [
  {
    id: "outside-pakistan",
    question: "Do you work with clients outside Pakistan?",
    answer:
      "Yes. I work remotely with clients in Pakistan and abroad, with calls in your time zone and a live link so you can see progress at any time.",
    order: 1,
    published: true,
  },
  {
    id: "timeline",
    question: "How long does a project take?",
    answer: "",
    order: 2,
    published: false,
  },
  {
    id: "payments",
    question: "How do payments work?",
    answer: "",
    order: 3,
    published: false,
  },
  {
    id: "existing-site",
    question: "Can you add automations to my existing website?",
    answer: "",
    order: 4,
    published: false,
  },
];
