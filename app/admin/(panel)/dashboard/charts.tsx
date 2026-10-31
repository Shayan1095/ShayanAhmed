"use client";

import { useState } from "react";
import { money } from "@/lib/admin/crm";
import type { SourceBar, StageBar, WeekBar } from "@/lib/admin/metrics";
import { cn } from "@/lib/utils";

/*
 * Dashboard charts in plain HTML (no chart library): one series each, in the
 * validated chart copper (--color-chart, light and dark). Thin bars with 4px
 * rounded data-ends, 2px gaps, recessive grid, a hover tooltip on every bar,
 * and a table for screen readers.
 */

function niceMax(n: number) {
  if (n <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(n)));
  return Math.ceil(n / step) * step;
}

export function WeeklyLeadsChart({ weeks }: { weeks: WeekBar[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...weeks.map((w) => w.leads)));
  const total = weeks.reduce((s, w) => s + w.leads, 0);
  const last = weeks.length - 1;

  return (
    <figure className="flex h-full flex-col">
      <figcaption className="sr-only">Leads per week for the last 12 weeks. {total} in total.</figcaption>
      <div className="relative flex-1 pl-7">
        {/* Grid: recessive hairlines at 0, half and max. */}
        {[1, 0.5, 0].map((f) => (
          <div key={f} aria-hidden="true" className="absolute inset-x-0 flex items-center" style={{ bottom: `${f * 100}%` }}>
            <span className="w-7 -translate-y-px pr-2 text-right font-mono text-[10px] text-muted">{Math.round(max * f)}</span>
            <span className={cn("h-px flex-1", f === 0 ? "bg-paper-edge" : "bg-paper-edge/45")} />
          </div>
        ))}
        <div aria-hidden="true" className="relative flex h-full min-h-[180px] items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
          {weeks.map((w, i) => (
            <div
              key={w.start}
              className="group relative flex h-full flex-1 cursor-default items-end justify-center"
              onMouseEnter={() => setHover(i)}
            >
              {/* Bar: thin, centred in a wider hit area. */}
              <div
                className={cn(
                  "w-[min(70%,22px)] rounded-t-[4px] bg-chart transition-[height,opacity] duration-500",
                  hover !== null && hover !== i && "opacity-45",
                )}
                style={{ height: `${(w.leads / max) * 100}%`, minHeight: w.leads ? 3 : 0 }}
              />
              {i === last && w.leads > 0 && hover === null && (
                <span className="absolute font-mono text-[11px] font-semibold" style={{ bottom: `calc(${(w.leads / max) * 100}% + 4px)` }}>
                  {w.leads}
                </span>
              )}
              {hover === i && (
                <div
                  className="glass-strong pointer-events-none absolute z-10 w-max -translate-x-1/2 rounded-lg px-2.5 py-1.5 text-[12px] leading-snug"
                  style={{ bottom: `calc(${(w.leads / max) * 100}% + 8px)`, left: "50%" }}
                >
                  <p className="font-semibold">Week of {w.label}</p>
                  <p className="text-muted">
                    {w.leads} {w.leads === 1 ? "lead" : "leads"}
                    {w.won > 0 && ` · ${w.won} won`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="mt-2 flex gap-[2px] pl-7">
        {weeks.map((w, i) => (
          <span key={w.start} className="flex-1 text-center font-mono text-[10px] text-muted">
            {i % 3 === 2 || i === last ? w.label : ""}
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

/** Horizontal bars with the value written beside each (no colour-only reading). */
export function BarList({
  rows,
  caption,
  format = (r) => String(r.count),
  href,
}: {
  rows: { key: string; label: string; count: number; sub?: string }[];
  caption: string;
  format?: (r: { count: number; sub?: string }) => string;
  href?: (key: string) => string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <figure>
      <figcaption className="sr-only">{caption}</figcaption>
      <ul className="flex flex-col gap-2.5" onMouseLeave={() => setHover(null)}>
        {rows.map((r) => {
          const body = (
            <>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
                <span className="truncate">{r.label}</span>
                <span className="shrink-0 font-mono text-[12px]">
                  {format(r)}
                  {r.sub && <span className="ml-1.5 text-muted">{r.sub}</span>}
                </span>
              </div>
              <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-paper-edge/35">
                <div
                  className={cn("h-full rounded-full bg-chart transition-[width,opacity] duration-500", hover && hover !== r.key && "opacity-45")}
                  style={{ width: `${(r.count / max) * 100}%`, minWidth: r.count ? 6 : 0 }}
                />
              </div>
            </>
          );
          return (
            <li key={r.key} onMouseEnter={() => setHover(r.key)}>
              {href ? (
                <a href={href(r.key)} className="block rounded-md outline-offset-4 hover:[&_span:first-child]:underline">
                  {body}
                </a>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

export function StageFunnel({ rows }: { rows: StageBar[] }) {
  return (
    <BarList
      caption="Leads in each pipeline stage, with their value"
      rows={rows.map((r) => ({ key: r.id, label: r.label, count: r.count, sub: r.value ? money(r.value, true) : undefined }))}
      href={(stage) => `/admin/inbox?stage=${stage}`}
    />
  );
}

export function SourceBars({ rows }: { rows: SourceBar[] }) {
  return <BarList caption="What leads asked for" rows={rows.map((r) => ({ key: r.label, label: r.label, count: r.count }))} />;
}
