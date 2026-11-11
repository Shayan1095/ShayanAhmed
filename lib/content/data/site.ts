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
  // The hero demo is modelled on the Brands Attire operations layer and labelled as a demo on screen.
  heroDemo: {
    source: "Brands Attire operations",
    decisions: [
      {
        agent: "Risk guard",
        title: "Order #1042 flagged: duplicate address",
        detail: "Same address as a cancelled order last week.",
        actions: [
          { label: "Approve", result: "Approved. Courier booked, customer notified.", primary: true },
          { label: "Hold", result: "Held. Customer asked to confirm the address." },
        ],
      },
      {
        agent: "Restock",
        title: "3 items are running low",
        detail: "Draft order to the supplier is ready.",
        actions: [
          { label: "Send order", result: "Sent. Supplier has the purchase order.", primary: true },
          { label: "Not yet", result: "Saved as a draft for tomorrow's briefing." },
        ],
      },
      {
        agent: "Returns",
        title: "Return request: size exchange",
        detail: "Within the 14-day window, item unworn.",
        actions: [
          { label: "Approve", result: "Approved. Exchange label emailed.", primary: true },
          { label: "Review", result: "Moved to your review list." },
        ],
      },
    ],
    routine: [
      { agent: "Reminders", text: "Cart reminder sent with a code" },
      { agent: "Catalogue", text: "Catalogue check: all clear" },
      { agent: "Checkout", text: "Order #1058 paid and packed" },
      { agent: "Briefing", text: "Daily briefing ready for 9:00" },
      { agent: "Feedback", text: "4 new reviews summarised" },
    ],
  },
  // Set these to show the "Book a call" button and the starting price on the contact section.
  bookingUrl: undefined,
  startingPrice: undefined,
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

/** FAQ starter questions. Answers are Shayan's to write (Admin → FAQ); empty ones never render. */
export const faqs: Faq[] = [
  {
    id: "outside-pakistan",
    question: "Do you work with clients outside Pakistan?",
    answer: "",
    order: 1,
    published: false,
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
