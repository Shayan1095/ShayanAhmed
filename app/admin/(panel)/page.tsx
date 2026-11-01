import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight, BellRing, Plus, TrendingUp } from "lucide-react";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader, Panel, PanelTitle } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { duration, money } from "@/lib/admin/crm";
import {
  dbState,
  getPlannerConfig,
  getSettings,
  listFaqs,
  listInquiries,
  listProjects,
  listTasks,
  listTestimonials,
} from "@/lib/admin/data";
import { contentHealth } from "@/lib/admin/health";
import { activityFeed, leadMetrics, type Kpi } from "@/lib/admin/metrics";
import { requireAdmin } from "@/lib/auth/dal";
import { cn } from "@/lib/utils";
import { BrutalCard, SourceBars, StageFunnel, StepSpark, WeeklyLeadsChart } from "./dashboard/charts";
import { Attention, Feed, Greeting, HealthList } from "./dashboard/widgets";
import { ImportStarter } from "./import-starter";
import { TodayCard } from "./today-card";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * The CRM home: how the business is doing (leads, replies, pipeline, wins),
 * who needs you right now, today's plan, and what the site still lacks.
 * Every number comes from your own records.
 */
export default async function DashboardPage() {
  await requireAdmin();
  const state = await dbState();
  if (state === "missing-env" || state === "unreachable")
    return (
      <>
        <PageHeader title="Dashboard" />
        <DbNotice state={state} />
      </>
    );

  const [inquiries, tasks, config, projects, testimonials, faqs, settings] = await Promise.all([
    listInquiries(),
    listTasks(),
    getPlannerConfig(),
    listProjects(),
    listTestimonials(),
    listFaqs(),
    getSettings(),
  ]);
  const m = leadMetrics(inquiries);
  const feed = activityFeed(inquiries, tasks);
  const health = contentHealth(projects, testimonials, faqs, settings);

  const diff = m.in30 - m.prev30;
  const kpis: Kpi[] = [
    {
      id: "new",
      label: "New leads",
      value: String(m.in30),
      note: "Last 30 days",
      delta: m.in30 || m.prev30 ? { text: `${diff >= 0 ? "+" : ""}${diff} vs previous 30`, good: diff === 0 ? null : diff > 0 } : undefined,
      spark: m.weeks.map((w) => w.leads),
    },
    {
      id: "waiting",
      label: "Waiting for reply",
      value: String(m.waiting.length),
      note: m.waiting.length ? "Reply fast: speed wins projects" : "Nobody is waiting",
    },
    {
      id: "reply",
      label: "Avg. first reply",
      value: m.avgReply === null ? "—" : duration(m.avgReply),
      note: m.avgReply === null ? "Shows after your first reply" : "Last 90 days",
      delta: m.avgReply === null ? undefined : { text: m.avgReply < 24 * 3600_000 ? "Within a day" : "Aim for under 24h", good: m.avgReply < 24 * 3600_000 },
    },
    {
      id: "pipeline",
      label: "Open pipeline",
      value: money(m.pipelineValue, true),
      note: `${m.open.length} open ${m.open.length === 1 ? "deal" : "deals"}`,
    },
    {
      id: "win",
      label: "Win rate",
      value: m.winRate === null ? "—" : `${Math.round(m.winRate * 100)}%`,
      note: m.won.length || m.lost.length ? `${m.won.length} won · ${money(m.wonValue, true)}` : "Shows once a deal closes",
    },
  ];

  const pick = (l: (typeof inquiries)[number]) => ({
    id: l.id,
    name: l.name,
    company: l.company,
    projectType: l.projectType,
    createdAt: l.createdAt,
    followUpAt: l.followUpAt,
    value: l.value,
    stage: l.stage,
  });
  const followUps = inquiries.filter((l) => l.status !== "archived" && l.followUpAt && ["new", "contacted", "proposal"].includes(l.stage));

  return (
    <>
      <PageHeader
        eyebrow={<Greeting />}
        title="Dashboard"
        description="How the business is doing, and what needs you today."
        actions={
          <>
            <Link href="/admin/inbox?new=1" className={buttonVariants({ variant: "outline", size: "lg" })}>
              <Plus /> Add lead
            </Link>
            <Link href="/admin/inbox" className={buttonVariants({ size: "lg" })}>
              Open pipeline <ArrowRight />
            </Link>
          </>
        }
      />
      {state === "empty" && <ImportStarter />}

      {/* KPI strip */}
      <section aria-label="Key numbers" className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k, i) => (
          <Panel glass key={k.id} className={cn("relative overflow-hidden p-4", i === 0 && "col-span-2 md:col-span-1")}>
            <p className="text-[12.5px] font-medium text-muted">{k.label}</p>
            <p className="mt-2 font-display text-[30px] font-extrabold leading-none tracking-[-0.02em]">{k.value}</p>
            <p className="mt-2 truncate text-[12px] text-muted">{k.note}</p>
            {k.delta && (
              <p
                className={cn(
                  "mt-1 inline-flex items-center gap-1 text-[12px] font-semibold",
                  k.delta.good === null ? "text-muted" : k.delta.good ? "text-good" : "text-alert",
                )}
              >
                {k.delta.good !== null && <TrendingUp className={cn("size-3.5", !k.delta.good && "rotate-180 -scale-x-100")} aria-hidden="true" />}
                {k.delta.text}
              </p>
            )}
            {k.spark && <StepSpark values={k.spark} />}
          </Panel>
        ))}
      </section>

      {/* Trend + pipeline */}
      <div className="mb-5 grid gap-5 lg:grid-cols-[1.65fr_1fr]">
        <BrutalCard index="01" title="Leads per week" meta="12 weeks">
          {inquiries.length ? (
            <WeeklyLeadsChart weeks={m.weeks} />
          ) : (
            <Empty text="No leads yet. Enquiries from the contact form, and leads you add, are counted here." />
          )}
        </BrutalCard>
        <BrutalCard index="02" title="Pipeline" action={{ href: "/admin/inbox", label: "Board" }}>
          <StageFunnel rows={m.byStage} />
          <dl className="mt-auto grid grid-cols-2 gap-2 pt-4 font-mono text-[10.5px] uppercase tracking-[0.1em]">
            <div className="brutal-sm rounded-[3px] bg-paper px-3 py-2">
              <dt className="text-muted">Open value</dt>
              <dd className="mt-0.5 text-[17px] font-bold normal-case tracking-normal text-ink">{money(m.pipelineValue)}</dd>
            </div>
            <div className="brutal-sm rounded-[3px] bg-chart px-3 py-2 text-on-copper">
              <dt>Won</dt>
              <dd className="mt-0.5 text-[17px] font-bold normal-case tracking-normal">{money(m.wonValue)}</dd>
            </div>
          </dl>
        </BrutalCard>
      </div>

      {/* Today */}
      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Panel className="flex flex-col p-5">
          <PanelTitle
            icon={<BellRing className="size-4 text-copper-ink" aria-hidden="true" />}
            aside={
              m.waiting.length > 0 && (
                <span className="rounded-full bg-copper px-2 py-0.5 text-[11.5px] font-semibold text-on-copper">{m.waiting.length} new</span>
              )
            }
          >
            Needs you
          </PanelTitle>
          <Attention waiting={m.waiting.map(pick)} followUps={followUps.map(pick)} />
        </Panel>
        <TodayCard tasks={tasks} config={config} />
        <BrutalCard index="03" title="Site health">
          {state === "ready" ? <HealthList checks={health} /> : <Empty text="Import the starter content to check the site." />}
        </BrutalCard>
      </div>

      {/* Context */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <BrutalCard index="04" title="What leads ask for" meta="By project type">
          {m.sources.length ? <SourceBars rows={m.sources} /> : <Empty text="Project types from the contact form are counted here." />}
        </BrutalCard>
        <Panel className="p-5">
          <PanelTitle icon={<Activity className="size-4 text-copper-ink" aria-hidden="true" />}>Recent activity</PanelTitle>
          <Feed items={feed} />
        </Panel>
      </div>
    </>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="flex flex-1 items-center justify-center py-10 text-center text-[13px] text-muted">{text}</p>;
}
