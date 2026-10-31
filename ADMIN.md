# Admin panel: build plan

The admin panel is a private daily tool at `/admin`. It lets Shayan run the
portfolio and his own work without touching code. Every screen and action
below has a reason to exist. Anything without one was left out.

Flat UI on the site's tokens (paper, ink, copper), shadcn primitives, keyboard friendly. Not indexed by search engines.

## Principles

1. **One owner.** A single admin account: email and a bcrypt password hash in env vars. There is no sign-up page, so nobody else can create an account.
2. **Checked twice.** The proxy redirects anyone signed out away from `/admin`. Every page and every server action also checks the session itself, so a missed route can't leak.
3. **The site never breaks.** Public pages read MongoDB. If the database is empty or unreachable, they fall back to the starter content in `lib/content/data`.
4. **Changes go live on save.** Each save refreshes only the pages that use that content (cache tags), so there are no redeploys.
5. **Safe edits.** Inputs are validated with zod on the server. Deletes ask for confirmation. Drafts stay hidden until they're published.

## Screens and their purpose

| Screen | What you do there | Why it exists |
|---|---|---|
| **Dashboard** | KPIs (new leads vs last month, waiting for reply, average first-reply time, open pipeline value, win rate), leads per week, pipeline by stage, who needs you (unanswered + follow-ups due), today's tasks, site health, recent activity | Know how the business is doing and what needs you, in one screen. Every number comes from your own records |
| **Leads** (`/admin/inbox`) | Pipeline board (New → Contacted → Proposal → Won / Lost, drag to move) or table; per lead: stage, deal value, follow-up date, notes timeline, reply by email, archive; add leads from WhatsApp, LinkedIn or referrals by hand | Never lose a lead, reply fast, follow up on time, and see what the pipeline is worth |
| **Projects → All projects** | Reorder; switch featured and published on or off; open any project to edit | Grow the portfolio over time without code |
| **Projects → Add project** | Every field of a new project, saved as a draft | Add work as soon as it ships |
| **Projects → Screenshots** | Drop or click to upload, replace or remove each project's customer view, owner view and cover, with alt text | Keep screenshots current without touching code; a replaced upload is deleted |
| **Testimonials → All / Add** | List, reorder and edit quotes; add one on its own page; publish only with consent | Social proof that stays honest (publishing is blocked without consent) |
| **FAQ** | Write answers, reorder them, publish | Answer objections before the first call |
| **Settings** | Availability line, email, LinkedIn, booking link, starting price, budget ranges, project types, spec sheet, portrait | Keep the facts on the site true |
| **Planner** | Personal to-do and progress tracking (below) | Plan the work and see progress |

### Planner (personal to-do and progress)

| Function | Purpose |
|---|---|
| **Board view**: columns you define (default: Backlog, This week, Doing, Done). Drag cards between columns, or use "Move to" from the keyboard. | See the state of all work at a glance |
| **List view**: search, plus filters by list, tag, priority and due date | Find any task fast |
| **Today view**: overdue, due today, and in progress | A focused daily plan without noise |
| **Task details**: notes, checklist, due date, priority, list, tags | Break big work into steps you can finish |
| **Lists**: your own areas, such as Portfolio, Clients and Learning, each with a colour | Separate the areas of your work |
| **Tags**, with colours | Group work that crosses lists |
| **Progress**: tasks done per week for the last 8 weeks, a weekly goal ring, a streak of days with something finished, completion by list | See whether you are moving, and where |
| **Customise**: rename, add, reorder and colour columns; choose which column counts as done; manage lists and tags; set the weekly goal | Make the planner fit how you work |

Completion is recorded automatically when a task enters a "done" column. It's cleared if the task leaves that column, which keeps the progress numbers honest.

## CRM theme and chrome

- **Frosted glass, used selectively.** Glass (blur + translucent fill) only on the chrome: sidebar, top bar, KPI cards, the command palette, dialogs and side panels. Tables, forms and long text sit on near-solid `surface` panels so they stay readable. Utilities: `glass`, `glass-strong`, `surface` in `app/globals.css`.
- **Light and dark.** The moon/sun button in the top bar (or Ctrl+K → Dark mode). The choice is saved per browser; the first visit follows the system setting. Dark mode swaps the palette tokens on `<html>` only while the admin is open; the public site is unaffected.
- **Low-power devices** get the same look without blur (solid fills), like the public site's lite tier.
- **Ctrl+K** opens search and commands: jump to any page, lead or project; create a lead, task, project or testimonial; switch theme; sign out.
- **New** (top bar) creates a lead, task, project or testimonial from anywhere.
- **Sidebar badges**: red = follow-ups due, copper = leads waiting for a first reply.
- Deal values are in USD (`CRM_CURRENCY` in `lib/admin/crm.ts`).

## Contact form (public)

- zod validation (shared rules with the client), honeypot, rate limit of 5 per hour per IP (stored in MongoDB with an auto-expiry).
- Saves an `Inquiry`, then emails Shayan through Resend with reply-to set to the visitor. If the email fails, the enquiry is still saved and shows in Leads.

## Data (MongoDB)

`Project`, `Testimonial`, `Faq`, `Settings` (single doc), `Inquiry`, `Task`, `PlannerConfig` (single doc: columns, lists, tags, weekly goal), `RateLimit` (expires automatically).

First run: **Dashboard → Import content** copies the current site content into the database. The button only shows while the database is empty.

## Environment variables

| Name | Purpose |
|---|---|
| `MONGODB_URI` | Database (local: `mongodb://127.0.0.1:27017/shayan-portfolio`; production: Atlas) |
| `AUTH_SECRET` | Signs the session cookie (`npx auth secret`) |
| `ADMIN_EMAIL` | The one admin login |
| `ADMIN_PASSWORD_HASH` | bcrypt hash, base64 encoded. Set it with `npm run admin:password` |
| `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` | Enquiry emails |
| `CLOUDINARY_URL` | Optional. Without it, uploads are stored in MongoDB and served from `/api/media/<id>` |

## Build order

1. Plan (this file)
2. Mongoose models, connection, content getters with fallback
3. Auth.js credentials, proxy, session checks, sign-in page with rate limiting
4. Admin shell, then Projects, Testimonials, FAQ and Settings, with cache-tag refresh
5. Planner: board, list, today, task details, progress, customise
6. Contact action (save, email, rate limit), Inbox, Overview
7. Tests (auth guard, content round trip, accessibility), build, commit
