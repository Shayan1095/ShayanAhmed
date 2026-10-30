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
| **Overview** | See new enquiries, tasks due today or overdue, this week's progress, and unpublished drafts | Start each day knowing what needs you |
| **Inbox** | Read contact form enquiries, mark them read or replied, reply by email, archive | Never lose a lead; know who is waiting on a reply |
| **Projects** | Add or edit projects; reorder them; switch featured, published and case study on or off | Grow the portfolio over time without code |
| **Testimonials** | Add quotes and link each one to a project; publish only with consent | Social proof that stays honest (publishing is blocked without consent) |
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

## Contact form (public)

- zod validation (shared rules with the client), honeypot, rate limit of 5 per hour per IP (stored in MongoDB with an auto-expiry).
- Saves an `Inquiry`, then emails Shayan through Resend with reply-to set to the visitor. If the email fails, the enquiry is still saved and shows in the Inbox.

## Data (MongoDB)

`Project`, `Testimonial`, `Faq`, `Settings` (single doc), `Inquiry`, `Task`, `PlannerConfig` (single doc: columns, lists, tags, weekly goal), `RateLimit` (expires automatically).

First run: **Overview → Import starter content** copies the current site content into the database. The button only shows while the database is empty.

## Environment variables

| Name | Purpose |
|---|---|
| `MONGODB_URI` | Database (local: `mongodb://127.0.0.1:27017/shayan-portfolio`; production: Atlas) |
| `AUTH_SECRET` | Signs the session cookie (`npx auth secret`) |
| `ADMIN_EMAIL` | The one admin login |
| `ADMIN_PASSWORD_HASH` | bcrypt hash, base64 encoded. Set it with `npm run admin:password` |
| `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` | Enquiry emails |
| `CLOUDINARY_URL` | Image uploads from the admin (optional; without it, paste image URLs) |

## Build order

1. Plan (this file)
2. Mongoose models, connection, content getters with fallback
3. Auth.js credentials, proxy, session checks, sign-in page with rate limiting
4. Admin shell, then Projects, Testimonials, FAQ and Settings, with cache-tag refresh
5. Planner: board, list, today, task details, progress, customise
6. Contact action (save, email, rate limit), Inbox, Overview
7. Tests (auth guard, content round trip, accessibility), build, commit
