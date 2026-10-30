import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FolderKanban, HelpCircle, Inbox, Quote } from "lucide-react";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader, Panel } from "@/components/admin/page-header";
import {
  dbState,
  getPlannerConfig,
  listFaqs,
  listInquiries,
  listProjects,
  listTasks,
  listTestimonials,
} from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/dal";
import { ImportStarter } from "./import-starter";
import { TodayCard } from "./today-card";

export const metadata: Metadata = { title: "Overview" };

/** Start of the day: who is waiting, what's due, and what on the site still needs attention. */
export default async function OverviewPage() {
  await requireAdmin();
  const state = await dbState();
  if (state === "missing-env" || state === "unreachable")
    return (
      <>
        <PageHeader title="Overview" />
        <DbNotice state={state} />
      </>
    );

  const [inquiries, tasks, config] = await Promise.all([listInquiries(), listTasks(), getPlannerConfig()]);
  const waiting = inquiries.filter((i) => i.status === "new" || i.status === "read");
  const fresh = inquiries.filter((i) => i.status === "new").length;

  const content =
    state === "ready"
      ? await Promise.all([listProjects(), listTestimonials(), listFaqs()]).then(([p, t, f]) => [
          {
            href: "/admin/projects",
            icon: FolderKanban,
            label: "Projects",
            main: `${p.filter((x) => x.published).length} live`,
            note: p.some((x) => !x.published) ? `${p.filter((x) => !x.published).length} drafts` : "No drafts",
          },
          {
            href: "/admin/testimonials",
            icon: Quote,
            label: "Testimonials",
            main: `${t.filter((x) => x.published && x.consent).length} live`,
            note: t.some((x) => !x.consent) ? `${t.filter((x) => !x.consent).length} waiting for consent` : "Add one when a client signs off",
          },
          {
            href: "/admin/faq",
            icon: HelpCircle,
            label: "FAQ",
            main: `${f.filter((x) => x.published && x.answer.trim()).length} live`,
            note: f.some((x) => !x.answer.trim()) ? `${f.filter((x) => !x.answer.trim()).length} need an answer` : "All answered",
          },
        ])
      : [];

  return (
    <>
      <PageHeader title="Overview" description="What needs you today." />
      {state === "empty" && <ImportStarter />}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold">
              <Inbox className="size-4" aria-hidden="true" /> Waiting for a reply
            </h2>
            {fresh > 0 && <span className="rounded-full bg-copper px-2 py-0.5 text-[11.5px] font-semibold text-ink">{fresh} new</span>}
          </div>
          <p className="font-display text-[34px] font-extrabold leading-none">{waiting.length}</p>
          {waiting.length === 0 ? (
            <p className="mt-2 text-[13.5px] text-muted">Nobody is waiting. New enquiries from the contact form land here.</p>
          ) : (
            <ul className="mt-3 divide-y divide-paper-edge/50">
              {waiting.slice(0, 3).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
                  <span className={i.status === "new" ? "truncate font-semibold" : "truncate"}>{i.name}</span>
                  <span className="truncate text-muted">{i.projectType || i.email}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/inbox" className="mt-auto inline-flex items-center gap-1 pt-4 text-[13.5px] font-semibold hover:underline">
            Open inbox <ArrowRight className="size-3.5" />
          </Link>
        </Panel>
        <TodayCard tasks={tasks} config={config} />
      </div>
      {content.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Website content</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {content.map(({ href, icon: Icon, label, main, note }) => (
              <Link key={href} href={href} className="group rounded-xl border border-paper-edge/70 bg-paper-hi p-4 hover:border-paper-edge">
                <p className="flex items-center gap-2 text-[13px] text-muted">
                  <Icon className="size-3.5" aria-hidden="true" /> {label}
                </p>
                <p className="mt-1 text-[18px] font-bold">{main}</p>
                <p className="text-[12.5px] text-muted">{note}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
