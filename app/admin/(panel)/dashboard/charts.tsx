"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { money } from "@/lib/admin/crm";
import type { SourceBar, StageBar, WeekBar } from "@/lib/admin/metrics";
import type { Stage } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

/*
 * Dashboard instruments (skeuomorphic, from DESIGN.md's materials): each chart
 * sits on a raised cream panel with screws and an engraved label, and reads
 * out on a recessed ink screen: lit copper columns, LED meters and inset
 * slider tracks. Values are always written as text; tables back the charts
 * for screen readers; reduced motion shows everything settled.
 */

/** Adds data-in once the element is on screen, which starts the animations. */
export function useInView<T extends HTMLElement>() {
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

/** Integer that counts up when it comes into view (an odometer readout). */
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
      const steps = Math.min(value, 12);
      let i = 0;
      const tick = () => {
        i += 1;
        setShown(i >= steps ? value : Math.round((value * i) / steps));
        if (i < steps) timer = window.setTimeout(tick, 55);
      };
      setShown(0);
      timer = window.setTimeout(tick, 150);
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

/** Raised instrument panel: corner screws, an engraved label with a status light, optional link. */
export function InstrumentCard({
  title,
  meta,
  action,
  className,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  action?: { href: string; label: string };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className={cn("instrument flex flex-col p-4 sm:p-5", className)}>
      {(["left-3 top-3", "right-3 top-3", "left-3 bottom-3", "right-3 bottom-3"] as const).map((pos) => (
        <span key={pos} aria-hidden="true" className={cn("instrument-screw", pos)} />
      ))}
      <header className="mb-4 flex items-center justify-between gap-3 px-3">
        <h2 className="engraved flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em]">
          <span aria-hidden="true" className="led" />
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {meta && <span className="engraved font-mono text-[10.5px] uppercase tracking-[0.12em]">{meta}</span>}
          {action && (
            <Link
              href={action.href}
              className="keycap inline-flex items-center gap-1 px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink transition-transform active:translate-y-[2px]"
            >
              {action.label} <ArrowUpRight className="size-3" aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}

function niceMax(n: number) {
  if (n <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(n)));
  return Math.ceil(n / step) * step;
}

/** Amber readout chip on the screen. */
function Readout({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/30 px-2.5 py-1.5 font-mono uppercase">
      <dt className="text-[9.5px] tracking-[0.14em] text-[var(--screen-dim)]">{k}</dt>
      <dd className="text-[16px] font-semibold leading-tight text-[var(--screen-amber)] [text-shadow:0_0_10px_rgb(224_154_79/0.5)]">{v}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Leads per week: lit copper columns on the screen, won lit cream     */
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
    <figure ref={ref} className="instrument-chart screen flex flex-1 flex-col p-4 sm:p-5">
      <figcaption className="sr-only">
        Leads per week for the last 12 weeks: {total} leads, {won} won.
      </figcaption>

      <div aria-hidden="true" className="relative z-[1] mb-4 flex flex-wrap items-end gap-x-5 gap-y-3">
        <p className="flex items-end gap-2">
          <Ticker
            value={total}
            className="font-mono text-[52px] font-semibold leading-[0.8] tracking-[-0.04em] text-[var(--screen-amber)] [text-shadow:0_0_18px_rgb(224_154_79/0.55)]"
          />
          <span className="pb-0.5 font-mono text-[10px] uppercase leading-tight tracking-[0.14em] text-[var(--screen-dim)]">
            Leads
            <br />
            12 wks
          </span>
        </p>
        <dl className="flex gap-2">
          <Readout k="Now" v={weeks[last].leads} />
          <Readout k="Peak" v={peak} />
          <Readout k="Won" v={won} />
        </dl>
        <div className="ml-auto flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--screen-dim)]">
          <span className="flex items-center gap-1.5">
            <span className="lit inline-block h-3 w-1.5 rounded-sm" /> Leads
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-1.5 rounded-sm" style={{ background: "var(--lit-cream)" }} /> Won
          </span>
        </div>
      </div>

      <div aria-hidden="true" className="relative z-[1] mt-5 flex-1 pl-7">
        {[1, 0.5, 0].map((f) => (
          <div key={f} className="absolute inset-x-0 flex items-center" style={{ bottom: `${f * 100}%` }}>
            <span className="w-7 pr-2 text-right font-mono text-[9.5px] text-[var(--screen-dim)]">{Math.round(max * f)}</span>
            <span className="flex-1 border-t border-[var(--screen-grid)]" />
          </div>
        ))}
        <div className="relative flex h-full min-h-[190px] items-end gap-2" onMouseLeave={() => setHover(null)}>
          {weeks.map((w, i) => {
            const pct = (w.leads / max) * 100;
            const now = i === last;
            const active = hover === i;
            return (
              <div key={w.start} className="relative flex h-full flex-1 items-end justify-center" onMouseEnter={() => setHover(i)}>
                {active && <span className="absolute inset-y-0 left-1/2 w-px bg-[var(--screen-amber)] opacity-40" />}
                {/* Unlit cell: the column's empty slot */}
                <div className="absolute bottom-0 h-full w-full max-w-[26px] rounded-t-md bg-white/[0.025]" />
                {w.leads > 0 && (
                  <div
                    data-rise
                    style={{ height: `${pct}%`, ["--i" as string]: i }}
                    className={cn(
                      "lit relative flex w-full max-w-[26px] flex-col justify-end overflow-hidden rounded-t-md transition-opacity",
                      !now && !active && "opacity-75",
                      hover !== null && !active && "opacity-40",
                    )}
                  >
                    {w.won > 0 && <div className="w-full" style={{ height: `${(w.won / w.leads) * 100}%`, background: "var(--lit-cream)" }} />}
                  </div>
                )}
                {w.leads > 0 && (
                  <span
                    className={cn("absolute font-mono text-[11px] font-semibold", active || now ? "text-[var(--screen-amber)]" : "text-[var(--screen-dim)]")}
                    style={{ bottom: `calc(${pct}% + 6px)` }}
                  >
                    {w.leads}
                  </span>
                )}
                {active && (
                  <div
                    className={cn(
                      "pointer-events-none absolute top-0 z-10 w-max rounded-lg border border-white/10 bg-[#1a1714]/95 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.08em] shadow-[0_10px_30px_-10px_black]",
                      i > weeks.length / 2 ? "right-full mr-2" : "left-full ml-2",
                    )}
                  >
                    <p className="text-[var(--screen-amber)]">Wk of {w.label}</p>
                    <p className="text-[var(--screen-fg)]">
                      {w.leads} {w.leads === 1 ? "lead" : "leads"} · {w.won} won
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div aria-hidden="true" className="relative z-[1] mt-2 flex gap-2 pl-7">
        {weeks.map((w, i) => (
          <span
            key={w.start}
            className={cn(
              "flex-1 whitespace-nowrap text-center font-mono text-[9.5px] uppercase tracking-[0.06em]",
              i === last ? "text-[var(--screen-amber)]" : "text-[var(--screen-dim)]",
            )}
          >
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
/* Slider tracks: pipeline stages and what leads ask for               */
/* ------------------------------------------------------------------ */

type TrackRow = { key: string; label: string; count: number; note?: string; href?: string };

function Tracks({ rows, caption, rank = false }: { rows: TrackRow[]; caption: string; rank?: boolean }) {
  const ref = useInView<HTMLElement>();
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <figure ref={ref} className="instrument-chart">
      <figcaption className="sr-only">{caption}</figcaption>
      <ul className="flex flex-col gap-1">
        {rows.map((r, i) => {
          const body = (
            <div className="flex items-center gap-3">
              <span className="keycap grid size-9 shrink-0 place-items-center font-mono text-[13px] font-semibold text-ink">
                {rank ? String(i + 1).padStart(2, "0") : r.count}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-baseline justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.08em]">
                  <span className="truncate font-semibold">{r.label}</span>
                  <span className="shrink-0 text-muted">
                    {rank && <span>{r.count} · </span>}
                    {r.note && <span className="font-semibold text-copper-ink">{r.note}</span>}
                  </span>
                </div>
                <div className="groove relative h-3 p-[3px]">
                  <div data-run style={{ width: `${(r.count / max) * 100}%`, ["--i" as string]: i }} className={cn("lit h-full rounded-full", !r.count && "invisible")} />
                </div>
              </div>
            </div>
          );
          return (
            <li key={r.key}>
              {r.href ? (
                <Link href={r.href} className="block rounded-xl p-1.5 transition-colors hover:bg-paper-lo/50">
                  {body}
                  <span className="sr-only">
                    : {r.count}
                    {r.note ? `, ${r.note}` : ""}
                  </span>
                </Link>
              ) : (
                <div className="p-1.5">{body}</div>
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
    <Tracks
      caption="Leads in each pipeline stage, with their value"
      rows={rows.map((r) => ({
        key: r.id,
        label: r.label,
        count: r.count,
        note: r.value ? money(r.value, true) : undefined,
        href: closed.has(r.id) ? "/admin/inbox" : `/admin/inbox?stage=${r.id}`,
      }))}
    />
  );
}

export function SourceBars({ rows }: { rows: SourceBar[] }) {
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  return (
    <Tracks
      rank
      caption="What leads asked for"
      rows={rows.map((r) => ({ key: r.label, label: r.label, count: r.count, note: `${Math.round((r.count / total) * 100)}%` }))}
    />
  );
}

/* ------------------------------------------------------------------ */
/* LED meter + KPI trace                                               */
/* ------------------------------------------------------------------ */

/** Row of LEDs on a small screen: lit = done. */
export function LedMeter({ lit, total, label }: { lit: number; total: number; label: string }) {
  const ref = useInView<HTMLDivElement>();
  return (
    <div ref={ref} role="img" aria-label={label} className="instrument-chart screen flex gap-1.5 p-2.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          {...(i < lit ? { "data-light": "" } : {})}
          style={{ ["--i" as string]: i }}
          className={cn("relative z-[1] h-4 flex-1 rounded-[3px]", i < lit ? "bg-[var(--led-on)] shadow-[0_0_10px_rgb(224_154_79/0.7)]" : "bg-[var(--led-off)]")}
        />
      ))}
    </div>
  );
}

/** Smooth trend trace with a glowing end point (decorative; the number carries the meaning). */
export function StepSpark({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, 26 - (v / max) * 22] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg aria-hidden="true" viewBox="-3 -3 106 34" preserveAspectRatio="none" className="absolute right-4 top-4 h-8 w-24 overflow-visible">
      <path d={`${d} L100 30 L0 30 Z`} className="fill-chart/15" />
      <path d={d} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" className="stroke-chart" />
      <circle cx={lx} cy={ly} r="3" className="fill-chart" style={{ filter: "drop-shadow(0 0 3px rgb(201 133 63 / 0.9))" }} />
    </svg>
  );
}
