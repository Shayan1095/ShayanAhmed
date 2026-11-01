"use client";

import { useState } from "react";
import { money } from "@/lib/admin/crm";
import type { Bucket, FunnelStep } from "@/lib/admin/analytics";
import { cn } from "@/lib/utils";
import { useInView } from "../dashboard/charts";

/*
 * Analytics instruments: each reads out on a recessed ink screen (see the
 * dashboard's charts.tsx for the shared materials). Values are written as
 * text and every chart has a table or list for screen readers.
 */

const dim = "text-[var(--screen-dim)]";
const amber = "text-[var(--screen-amber)] [text-shadow:0_0_10px_rgb(224_154_79/0.5)]";

/** Funnel: stacked lit bars narrowing stage by stage, with the step conversion between them. */
export function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const ref = useInView<HTMLElement>();
  const top = Math.max(1, steps[0]?.count ?? 0);
  return (
    <figure ref={ref} className="instrument-chart screen p-4 sm:p-5">
      <figcaption className="sr-only">
        Conversion funnel: {steps.map((s) => `${s.label} ${s.count}`).join(", ")}.
      </figcaption>
      <ol aria-hidden="true" className="relative z-[1] flex flex-col gap-1">
        {steps.map((s, i) => (
          <li key={s.id}>
            {s.rate !== null && (
              <p className={cn("my-1 pl-[88px] font-mono text-[10px] uppercase tracking-[0.12em]", dim)}>
                ↓ <span className={amber}>{Math.round(s.rate * 100)}%</span> moved on
              </p>
            )}
            <div className="flex items-center gap-3">
              <span className={cn("w-[76px] shrink-0 text-right font-mono text-[10.5px] uppercase tracking-[0.1em]", dim)}>{s.label}</span>
              <div className="flex-1">
                <div
                  data-run
                  style={{ width: `${Math.max(4, (s.count / top) * 100)}%`, marginLeft: `${(1 - s.count / top) * 50}%`, ["--i" as string]: i }}
                  className="lit flex h-8 items-center justify-center rounded-md"
                >
                  <span className="font-mono text-[13px] font-semibold text-[#1a1208]">{s.count}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}

/** Vertical LED columns: one per bucket, each column a stack of lit segments. */
export function LedColumns({
  buckets,
  caption,
  highlight,
}: {
  /** text: the readout above the column (defaults to the count); warn: light it red (stale, slow). */
  buckets: (Bucket & { text?: string; warn?: boolean })[];
  caption: string;
  highlight?: number;
}) {
  const ref = useInView<HTMLElement>();
  const segs = 10;
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <figure ref={ref} className="instrument-chart screen p-4 sm:p-5">
      <figcaption className="sr-only">{caption}</figcaption>
      <div aria-hidden="true" className="relative z-[1] flex items-end gap-3">
        {buckets.map((b, i) => {
          const lit = b.count ? Math.max(1, Math.round((b.count / max) * segs)) : 0;
          const warn = Boolean(b.warn);
          return (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
              <span className={cn("font-mono text-[12px] font-semibold", b.count ? amber : dim, warn && b.count && "!text-[#f08f8f] [text-shadow:0_0_10px_rgb(240_143_143/0.5)]")}>
                {b.text ?? b.count}
              </span>
              <div className="flex w-full max-w-[44px] flex-col-reverse gap-[3px]">
                {Array.from({ length: segs }, (_, s) => {
                  const on = s < lit;
                  return (
                    <span
                      key={s}
                      {...(on ? { "data-light": "" } : {})}
                      style={{ ["--i" as string]: i * 2 + s }}
                      className={cn(
                        "h-[9px] rounded-[2px]",
                        !on && "bg-[var(--led-off)]",
                        on && !warn && "bg-[var(--led-on)] shadow-[0_0_8px_rgb(224_154_79/0.6)]",
                        on && warn && "bg-[#e0796f] shadow-[0_0_8px_rgb(224_121_111/0.6)]",
                        highlight === i && on && "ring-1 ring-white/50",
                      )}
                    />
                  );
                })}
              </div>
              <span className={cn("whitespace-nowrap font-mono text-[9.5px] uppercase tracking-[0.08em]", highlight === i ? "text-[var(--screen-amber)]" : dim)}>
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
      <ul className="sr-only">
        {buckets.map((b) => (
          <li key={b.label}>
            {b.label}: {b.text ?? b.count}
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Money columns (won per month): lit copper columns with value labels and a hover readout. */
export function MoneyColumns({ months }: { months: { label: string; key: string; value: number; deals: number }[] }) {
  const ref = useInView<HTMLElement>();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...months.map((m) => m.value));
  const total = months.reduce((s, m) => s + m.value, 0);
  return (
    <figure ref={ref} className="instrument-chart screen flex flex-col p-4 sm:p-5">
      <figcaption className="sr-only">
        Value won per month: {months.map((m) => `${m.label} ${money(m.value)}`).join(", ")}.
      </figcaption>
      <p aria-hidden="true" className="relative z-[1] mb-3 flex items-baseline gap-2">
        <span className={cn("font-mono text-[30px] font-semibold leading-none", amber)}>{money(total, true)}</span>
        <span className={cn("font-mono text-[10px] uppercase tracking-[0.14em]", dim)}>won · {months.length} months</span>
      </p>
      <div aria-hidden="true" className="relative z-[1] flex h-[150px] items-end gap-3" onMouseLeave={() => setHover(null)}>
        {months.map((m, i) => (
          <div key={m.key} className="relative flex h-full flex-1 flex-col items-center justify-end" onMouseEnter={() => setHover(i)}>
            <div className="absolute bottom-0 h-full w-full max-w-[40px] rounded-t-md bg-white/[0.025]" />
            {m.value > 0 && (
              <>
                <span className={cn("relative mb-1 font-mono text-[10.5px] font-semibold", hover === i ? amber : dim)}>{money(m.value, true)}</span>
                <div data-rise style={{ height: `${(m.value / max) * 82}%`, ["--i" as string]: i }} className={cn("lit relative w-full max-w-[40px] rounded-t-md", hover !== null && hover !== i && "opacity-45")} />
              </>
            )}
            {hover === i && (
              <div className="pointer-events-none absolute top-0 z-10 w-max rounded-lg border border-white/10 bg-[#1a1714]/95 px-2.5 py-1.5 font-mono text-[10.5px] uppercase text-[var(--screen-fg)]">
                {m.deals} {m.deals === 1 ? "deal" : "deals"}
              </div>
            )}
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="relative z-[1] mt-2 flex gap-3">
        {months.map((m, i) => (
          <span key={m.key} className={cn("flex-1 text-center font-mono text-[9.5px] uppercase", i === months.length - 1 ? "text-[var(--screen-amber)]" : dim)}>
            {m.label}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** Weekday × part-of-day grid of LED cells; brightness = how many leads arrived then. */
export function ArrivalHeatmap({
  days,
  slots,
  grid,
  max,
}: {
  days: string[];
  slots: string[];
  grid: number[][];
  max: number;
}) {
  const ref = useInView<HTMLElement>();
  return (
    <figure ref={ref} className="instrument-chart screen p-4 sm:p-5">
      <figcaption className="sr-only">When leads arrive, by weekday and part of the day.</figcaption>
      <div aria-hidden="true" className="relative z-[1] grid grid-cols-[44px_repeat(4,minmax(0,1fr))] gap-1.5">
        <span />
        {slots.map((s) => (
          <span key={s} className={cn("text-center font-mono text-[9.5px] uppercase tracking-[0.08em]", dim)}>
            {s}
          </span>
        ))}
        {days.map((d, r) => (
          <Row key={d} day={d} values={grid[r]} max={max} row={r} />
        ))}
      </div>
      <table className="sr-only">
        <thead>
          <tr>
            <th>Day</th>
            {slots.map((s) => (
              <th key={s}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((d, r) => (
            <tr key={d}>
              <td>{d}</td>
              {grid[r].map((v, c) => (
                <td key={c}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function Row({ day, values, max, row }: { day: string; values: number[]; max: number; row: number }) {
  return (
    <>
      <span className={cn("self-center font-mono text-[10px] uppercase tracking-[0.08em]", dim)}>{day}</span>
      {values.map((v, c) => {
        const k = max ? v / max : 0;
        return (
          <span
            key={c}
            title={`${day} ${v}`}
            {...(v ? { "data-light": "" } : {})}
            style={{
              ["--i" as string]: row * 4 + c,
              background: v ? `rgb(224 154 79 / ${0.18 + k * 0.82})` : "var(--led-off)",
              boxShadow: v ? `0 0 ${4 + k * 12}px rgb(224 154 79 / ${0.2 + k * 0.5})` : undefined,
            }}
            className="grid h-7 place-items-center rounded-[4px] font-mono text-[10.5px] font-semibold text-[#1a1208]"
          >
            {v || ""}
          </span>
        );
      })}
    </>
  );
}
