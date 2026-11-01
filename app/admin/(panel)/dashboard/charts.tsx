"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { money } from "@/lib/admin/crm";
import type { SourceBar, StageBar, WeekBar } from "@/lib/admin/metrics";
import type { Stage } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

/*
 * Dashboard charts, brutalist: hard 2px frames, offset block shadows, hatched
 * copper fills, square ends, raw uppercase mono labels and stepped motion
 * (bars snap up in blocks when they scroll into view). Text stays in ink, the
 * chart copper is the validated --color-chart, every chart has a table or
 * written values for screen readers, and reduced motion shows it settled.
 */

/** Adds data-in once the element is on screen, which starts the stepped animations. */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.in = "";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/** Integer that ticks up in coarse steps (an odometer, not a tween). */
export function Ticker({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const steps = Math.min(value, 9);
      let i = 0;
      const tick = () => {
        i += 1;
        setShown(i >= steps ? value : Math.round((value * i) / steps));
        if (i < steps) timer = window.setTimeout(tick, 70);
      };
      setShown(0);
      timer = window.setTimeout(tick, 120);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [value]);
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}

/** Brutal card: hard frame + offset shadow, an inverted label tape as the title. */
export function BrutalCard({
  index,
  title,
  meta,
  action,
  className,
  children,
}: {
  index: string;
  title: string;
  meta?: React.ReactNode;
  action?: { href: string; label: string };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className={cn("brutal flex flex-col p-0", className)}>
      <header className="flex items-stretch justify-between gap-3 border-b-2 border-[var(--brutal-line)]">
        <h2 className="flex items-stretch font-mono text-[11.5px] font-semibold uppercase tracking-[0.12em]">
          <span className="grid place-items-center border-r-2 border-[var(--brutal-line)] bg-ink px-2.5 text-paper">{index}</span>
          <span className="grid place-items-center px-3 py-2.5">{title}</span>
        </h2>
        <div className="flex items-center gap-3 pr-3">
          {meta && <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">{meta}</span>}
          {action && (
            <Link
              href={action.href}
              className="brutal-sm inline-flex items-center gap-1 rounded-[3px] bg-paper-hi px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] transition-transform hover:-translate-x-px hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              {action.label} <ArrowUpRight className="size-3" aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>
      <div className="flex flex-1 flex-col p-4 sm:p-5">{children}</div>
    </section>
  );
}

function niceMax(n: number) {
  if (n <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(n)));
  return Math.ceil(n / step) * step;
}

/* ------------------------------------------------------------------ */
/* Leads per week: blocky columns, won stacked solid at the base       */
/* ------------------------------------------------------------------ */

export function WeeklyLeadsChart({ weeks }: { weeks: WeekBar[] }) {
  const ref = useInView<HTMLElement>();
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...weeks.map((w) => w.leads)));
  const total = weeks.reduce((s, w) => s + w.leads, 0);
  const won = weeks.reduce((s, w) => s + w.won, 0);
  const peak = Math.max(...weeks.map((w) => w.leads));
  const last = weeks.length - 1;

  return (
    <figure ref={ref} className="brutal-chart flex h-full flex-col">
      <figcaption className="sr-only">
        Leads per week for the last 12 weeks: {total} leads, {won} won.
      </figcaption>

      {/* Headline numbers */}
      <div aria-hidden="true" className="mb-5 flex flex-wrap items-end gap-x-6 gap-y-2">
        <p className="flex items-end gap-2">
          <Ticker value={total} className="font-display text-[56px] font-extrabold leading-[0.8] tracking-[-0.04em]" />
          <span className="pb-0.5 font-mono text-[10.5px] uppercase leading-tight tracking-[0.12em] text-muted">
            Leads
            <br />
            12 wks
          </span>
        </p>
        <dl className="flex gap-2 font-mono text-[10.5px] uppercase tracking-[0.1em]">
          {[
            { k: "Now", v: weeks[last].leads },
            { k: "Peak", v: peak },
            { k: "Won", v: won },
          ].map((x) => (
            <div key={x.k} className="brutal-sm rounded-[3px] bg-paper px-2 py-1">
              <dt className="text-muted">{x.k}</dt>
              <dd className="text-[15px] font-bold leading-none text-ink">{x.v}</dd>
            </div>
          ))}
        </dl>
        <div className="ml-auto flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="hatch inline-block size-3 border-2 border-[var(--brutal-line)]" /> Leads
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 border-2 border-[var(--brutal-line)] bg-ink" /> Won
          </span>
        </div>
      </div>

      {/* Plot */}
      <div aria-hidden="true" className="relative flex-1 pl-8">
        {[1, 0.5].map((f) => (
          <div key={f} className="absolute inset-x-0 flex items-center" style={{ bottom: `${f * 100}%` }}>
            <span className="w-8 pr-2 text-right font-mono text-[10px] font-semibold text-muted">{Math.round(max * f)}</span>
            <span className="flex-1 border-t-2 border-dashed border-paper-edge" />
          </div>
        ))}
        <div className="relative flex h-full min-h-[200px] items-end gap-1.5" onMouseLeave={() => setHover(null)}>
          {weeks.map((w, i) => {
            const pct = (w.leads / max) * 100;
            const now = i === last;
            const active = hover === i;
            return (
              <div key={w.start} className="relative flex h-full flex-1 items-end justify-center" onMouseEnter={() => setHover(i)}>
                {/* Crosshair + hard-block tooltip beside the column */}
                {active && <span className="absolute inset-y-0 left-1/2 border-l-2 border-dashed border-[var(--brutal-line)] opacity-50" />}
                {active && (
                  <div
                    className={cn(
                      "pointer-events-none absolute top-0 z-10 w-max border-2 border-[var(--brutal-line)] bg-ink px-3 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-paper shadow-[4px_4px_0_var(--color-chart)]",
                      i > weeks.length / 2 ? "right-full mr-2" : "left-full ml-2",
                    )}
                  >
                    <p className="font-bold">Wk of {w.label}</p>
                    <p>
                      {w.leads} {w.leads === 1 ? "lead" : "leads"} · {w.won} won
                    </p>
                  </div>
                )}
                {w.leads > 0 && (
                  <div
                    data-rise
                    style={{ height: `${pct}%`, ["--i" as string]: i }}
                    className={cn(
                      "relative flex w-full max-w-[34px] flex-col justify-end border-2 border-b-0 border-[var(--brutal-line)] transition-colors",
                      active ? "bg-ink" : now ? "bg-chart" : "hatch",
                      hover !== null && !active && "opacity-60",
                    )}
                  >
                    {w.won > 0 && <div className={cn("w-full", active ? "bg-copper" : "bg-ink")} style={{ height: `${(w.won / w.leads) * 100}%` }} />}
                    <span
                      data-pop
                      style={{ ["--i" as string]: i }}
                      className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-[12px] font-bold"
                    >
                      {w.leads}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Baseline */}
        <div className="h-[3px] bg-[var(--brutal-line)]" />

      </div>
      <div aria-hidden="true" className="mt-2 flex gap-1.5 pl-8">
        {weeks.map((w, i) => (
          <span key={w.start} className={cn("flex-1 whitespace-nowrap text-center font-mono text-[9.5px] uppercase tracking-[0.06em]", i === last ? "font-bold text-ink" : "text-muted")}>
            {i === last ? "Now" : i % 3 === 2 ? w.label : ""}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <thead>
          <tr>
            <th>Week of</th>
            <th>Leads</th>
            <th>Won</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.start}>
              <td>{w.label}</td>
              <td>{w.leads}</td>
              <td>{w.won}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Block bars: pipeline stages and what leads ask for                  */
/* ------------------------------------------------------------------ */

type BlockRow = { key: string; label: string; count: number; note?: string; solid?: boolean; href?: string };

function BlockBars({ rows, caption, rank = false }: { rows: BlockRow[]; caption: string; rank?: boolean }) {
  const ref = useInView<HTMLElement>();
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <figure ref={ref} className="brutal-chart">
      <figcaption className="sr-only">{caption}</figcaption>
      <ul className="flex flex-col gap-2.5">
        {rows.map((r, i) => {
          const body = (
            <div className="flex items-stretch gap-2.5">
              <span className="grid w-9 shrink-0 place-items-center border-2 border-[var(--brutal-line)] bg-ink font-mono text-[13px] font-bold text-paper">
                {rank ? String(i + 1).padStart(2, "0") : r.count}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-baseline justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.08em]">
                  <span className="truncate font-semibold">{r.label}</span>
                  <span className="shrink-0 text-muted">
                    {rank ? r.count : ""}
                    {r.note && <span className="ml-1.5 font-semibold text-ink">{r.note}</span>}
                  </span>
                </div>
                <div className="h-4 border-2 border-[var(--brutal-line)] bg-paper">
                  <div
                    data-extend
                    style={{ width: `${(r.count / max) * 100}%`, ["--i" as string]: i }}
                    className={cn("h-full", r.solid ? "bg-chart" : "hatch", r.count && "border-r-2 border-[var(--brutal-line)]")}
                  />
                </div>
              </div>
            </div>
          );
          return (
            <li key={r.key}>
              {r.href ? (
                <Link
                  href={r.href}
                  className="block rounded-[3px] p-1 transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-paper hover:shadow-[var(--brutal-shadow-sm)] focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {body}
                  <span className="sr-only">: {r.count}{r.note ? `, ${r.note}` : ""}</span>
                </Link>
              ) : (
                <div className="p-1">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

const closed = new Set<Stage>(["won", "lost"]);

export function StageFunnel({ rows }: { rows: StageBar[] }) {
  return (
    <BlockBars
      caption="Leads in each pipeline stage, with their value"
      rows={rows.map((r) => ({
        key: r.id,
        label: r.label,
        count: r.count,
        note: r.value ? money(r.value, true) : undefined,
        solid: r.id === "won",
        href: closed.has(r.id) ? "/admin/inbox" : `/admin/inbox?stage=${r.id}`,
      }))}
    />
  );
}

export function SourceBars({ rows }: { rows: SourceBar[] }) {
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  return (
    <BlockBars
      rank
      caption="What leads asked for"
      rows={rows.map((r, i) => ({ key: r.label, label: r.label, count: r.count, note: `${Math.round((r.count / total) * 100)}%`, solid: i === 0 }))}
    />
  );
}

/* ------------------------------------------------------------------ */
/* KPI step line                                                       */
/* ------------------------------------------------------------------ */

/** Stepped trend line with square markers (decorative; the number carries the meaning). */
export function StepSpark({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const w = 100 / (values.length - 1);
  const y = (v: number) => 26 - (v / max) * 22;
  let d = `M0 ${y(values[0])}`;
  values.slice(1).forEach((v, i) => {
    d += ` H${(i + 1) * w} V${y(v)}`;
  });
  const lastY = y(values[values.length - 1]);
  return (
    <svg aria-hidden="true" viewBox="-3 -3 106 34" preserveAspectRatio="none" className="absolute right-4 top-4 h-8 w-24 overflow-visible">
      <path d={d} fill="none" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="miter" className="stroke-[var(--brutal-line)]" />
      <rect x={100 - 3} y={lastY - 3} width="6" height="6" className="fill-chart stroke-[var(--brutal-line)]" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
