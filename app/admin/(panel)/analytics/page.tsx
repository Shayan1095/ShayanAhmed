import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { arrivalHeat, dealAgeing, funnel, replySpeed, salesFacts, stageOdds, wonByMonth } from "@/lib/admin/analytics";
import { duration, money, stageLabel } from "@/lib/admin/crm";
import { dbState, listInquiries } from "@/lib/admin/data";
import { leadMetrics } from "@/lib/admin/metrics";
import type { Stage } from "@/lib/admin/types";
import { requireAdmin } from "@/lib/auth/dal";
import { InstrumentCard, SourceBars, WeeklyLeadsChart } from "../dashboard/charts";
import { ArrivalHeatmap, FunnelChart, LedColumns, MoneyColumns } from "./instruments";

export const metadata: Metadata = { title: "Analytics" };

/**
 * Analytics: how leads turn into money. Funnel, reply speed, revenue, when
 * leads arrive, deal ageing and a weighted forecast, all from your own lead
 * records, with a plain-language takeaway on each instrument.
 */
export default async function AnalyticsPage() {
  await requireAdmin();
  const state = await dbState();
  if (state === "missing-env" || state === "unreachable")
    return (
      <>
        <PageHeader title="Analytics" />
        <DbNotice state={state} />
      </>
    );

  const leads = await listInquiries();
  if (leads.length === 0)
    return (
      <>
        <PageHeader title="Analytics" description="How your leads turn into projects and money." />
        <div className="instrument flex flex-col items-start gap-3 p-8">
          <p className="font-display text-[22px] font-extrabold">The instruments switch on with your first lead</p>
          <p className="max-w-[60ch] text-[14px] text-muted">
            Every chart here is built from your own leads: website enquiries arrive on their own, and you can add leads from WhatsApp, LinkedIn or referrals by hand.
          </p>
          <Link href="/admin/inbox?new=1" className={buttonVariants({ size: "lg" })}>
            Add a lead <ArrowRight />
          </Link>
        </div>
      </>
    );

  const m = leadMetrics(leads);
  const steps = funnel(leads);
  const speed = replySpeed(leads);
  const months = wonByMonth(leads);
  const heat = arrivalHeat(leads);
  const ageing = dealAgeing(leads);
  const facts = salesFacts(leads);
  const stale = ageing.filter((a) => a.stale).reduce((s, a) => s + a.count, 0);
  const wonRate = steps[3].count && steps[0].count ? steps[3].count / steps[0].count : 0;
  const fastShare = speed.buckets.slice(0, 3).reduce((s, b) => s + b.count, 0) / Math.max(1, speed.buckets.reduce((s, b) => s + b.count, 0));

  return (
    <>
      <PageHeader title="Analytics" description="How your leads turn into projects and money. Every number comes from your own records." />

      {/* Money readouts */}
      <section aria-label="Money" className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: "Forecast", v: money(facts.forecast), note: "Weighted open pipeline" },
          { k: "Avg. deal", v: facts.avgDeal === null ? "—" : money(facts.avgDeal), note: `${m.won.length} won so far` },
          { k: "Sales cycle", v: facts.cycle === null ? "—" : `${Math.round(facts.cycle)} days`, note: "First message → signed" },
          { k: "Lead → won", v: `${Math.round(wonRate * 100)}%`, note: `${steps[3].count} of ${steps[0].count} leads` },
        ].map((x) => (
          <div key={x.k} className="instrument p-3">
            <div className="screen px-4 py-3">
              <p className="relative z-[1] font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--screen-dim)]">{x.k}</p>
              <p className="relative z-[1] mt-1 font-mono text-[26px] font-semibold leading-none text-[var(--screen-amber)] [text-shadow:0_0_14px_rgb(224_154_79/0.5)]">
                {x.v}
              </p>
            </div>
            <p className="engraved mt-2 px-1 text-[11.5px]">{x.note}</p>
          </div>
        ))}
      </section>

      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <InstrumentCard title="Conversion funnel" meta="All time">
          <FunnelChart steps={steps} />
          <Takeaway>
            {weakestStep(steps)}
          </Takeaway>
        </InstrumentCard>
        <InstrumentCard title="Reply speed" meta={speed.median === null ? "No replies yet" : `Median ${duration(speed.median)}`}>
          <LedColumns buckets={speed.buckets.map((b, i) => ({ ...b, warn: i >= 3 }))} caption="How fast you sent the first reply" highlight={0} />
          <Takeaway>
            {speed.median === null
              ? "Reply to a lead (or move it to Contacted) to start measuring."
              : `${Math.round(fastShare * 100)}% of replies went out within a day. Clients often sign with whoever answers first.`}
          </Takeaway>
        </InstrumentCard>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <InstrumentCard title="Revenue won" meta="Last 6 months">
          <MoneyColumns months={months} />
          <Takeaway>Counts deals you moved to Won, by the month they closed, at the value you set on each lead.</Takeaway>
        </InstrumentCard>
        <InstrumentCard title="Open deals by age" meta={stale ? `${stale} going cold` : "All fresh"}>
          <LedColumns buckets={ageing.map((a) => ({ ...a, warn: a.stale }))} caption="Open deals by how long since they arrived" />
          <Takeaway>
            {stale ? (
              <>
                {stale} open {stale === 1 ? "deal is" : "deals are"} over two weeks old.{" "}
                <Link href="/admin/inbox" className="font-semibold text-copper-ink underline underline-offset-2">
                  Follow up or close them
                </Link>
                .
              </>
            ) : (
              "Nothing has been waiting more than two weeks. Keep it that way."
            )}
          </Takeaway>
        </InstrumentCard>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <InstrumentCard title="When leads arrive" meta="Your time zone">
          <ArrivalHeatmap days={heat.days} slots={heat.slots} grid={heat.grid} max={heat.max} />
          <Takeaway>
            {heat.best ? `Busiest: ${heat.best.day} ${heat.best.slot.toLowerCase()}. Be online then to reply fast.` : "Shows once leads come in."}
          </Takeaway>
        </InstrumentCard>
        <InstrumentCard title="Leads per week" meta="12 weeks">
          <WeeklyLeadsChart weeks={m.weeks} />
        </InstrumentCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <InstrumentCard title="What leads ask for" meta="By project type">
          <SourceBars rows={m.sources} />
        </InstrumentCard>
        <InstrumentCard title="How the forecast works">
          <ul className="flex flex-col gap-2.5">
            {(Object.entries(stageOdds) as [Stage, number][]).map(([stage, odds]) => {
              const xs = facts.openCount ? leads.filter((l) => l.stage === stage && l.status !== "archived") : [];
              const value = xs.reduce((s, l) => s + l.value, 0);
              return (
                <li key={stage} className="flex items-center justify-between gap-3 rounded-xl bg-paper-lo/40 px-3 py-2.5">
                  <span className="text-[13.5px]">
                    <span className="font-semibold">{stageLabel[stage]}</span>
                    <span className="text-muted"> · {money(value)} × {Math.round(odds * 100)}%</span>
                  </span>
                  <span className="font-mono text-[13px] font-semibold">{money(value * odds)}</span>
                </li>
              );
            })}
          </ul>
          <Takeaway>
            {facts.unvalued
              ? `${facts.unvalued} open ${facts.unvalued === 1 ? "lead has" : "leads have"} no value yet. Add one on each lead for a truer forecast.`
              : "Every open lead has a value. The odds per stage are set in lib/admin/analytics.ts."}
          </Takeaway>
        </InstrumentCard>
      </div>
    </>
  );
}

function Takeaway({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 px-1 text-[13px] leading-relaxed text-muted">{children}</p>;
}

/** The step where most leads drop out, in words. */
function weakestStep(steps: ReturnType<typeof funnel>) {
  const withRate = steps.filter((s) => s.rate !== null && steps[steps.indexOf(s) - 1].count > 0);
  if (!withRate.length) return "Move leads through the stages to see where they drop out.";
  const worst = withRate.reduce((a, b) => (b.rate! < a.rate! ? b : a));
  const prev = steps[steps.indexOf(worst) - 1];
  return `Biggest drop: ${prev.label} → ${worst.label} (${Math.round(worst.rate! * 100)}% move on). That's the step to work on.`;
}
