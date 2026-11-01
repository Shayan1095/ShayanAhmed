"use client";

import { heatWeeks, type DayStat } from "@/lib/admin/ritual";
import { cn } from "@/lib/utils";
import { useInView } from "../../dashboard/charts";

/** 16 weeks of finished tasks as LED cells (GitHub-style); a ring marks days that hit the goal. */
export function Heatmap({ today, stats, goal }: { today: string; stats: Map<string, DayStat>; goal: number }) {
  const ref = useInView<HTMLDivElement>();
  const weeks = heatWeeks(today, 16);
  const cells = weeks.flat().filter((k) => k <= today);
  const totalDone = cells.reduce((s, k) => s + (stats.get(k)?.done ?? 0), 0);
  const goalDays = cells.filter((k) => (stats.get(k)?.done ?? 0) >= goal).length;
  const best = cells.reduce<{ k: string; n: number } | null>((b, k) => {
    const n = stats.get(k)?.done ?? 0;
    return n > (b?.n ?? 0) ? { k, n } : b;
  }, null);
  const level = (n: number) => (n === 0 ? 0 : n < Math.max(2, Math.ceil(goal / 2)) ? 1 : n < goal ? 2 : n < goal * 2 ? 3 : 4);
  const fill = ["", "rgb(224 154 79 / 0.3)", "rgb(224 154 79 / 0.55)", "rgb(224 154 79 / 0.85)", "#f0b46c"];

  return (
    <div className="flex flex-col gap-3">
      <div ref={ref} className="instrument-chart screen p-4">
        <div role="img" aria-label={`${totalDone} tasks finished in 16 weeks; daily goal met on ${goalDays} days`} className="relative z-[1] flex gap-[5px]">
          <div aria-hidden="true" className="mr-1 flex flex-col justify-around">
            {["M", "", "W", "", "F", "", "S"].map((d, i) => (
              <span key={i} className="font-mono text-[9px] leading-none text-[var(--screen-dim)]">
                {d || " "}
              </span>
            ))}
          </div>
          {weeks.map((w, wi) => (
            <div key={w[0]} className="flex min-w-0 flex-1 flex-col gap-[5px]">
              {w.map((k, di) => {
                const future = k > today;
                const n = stats.get(k)?.done ?? 0;
                const lv = level(n);
                return (
                  <span
                    key={k}
                    title={future ? undefined : `${k}: ${n} done`}
                    {...(!future && lv ? { "data-light": "" } : {})}
                    style={{
                      ["--i" as string]: wi * 2 + di,
                      background: future ? "transparent" : lv ? fill[lv] : "var(--led-off)",
                      boxShadow: lv >= 3 ? "0 0 8px rgb(224 154 79 / 0.6)" : undefined,
                    }}
                    className={cn("aspect-square w-full max-w-[26px] rounded-[3px]", k === today && "ring-1 ring-white/70", n >= goal && "outline outline-1 outline-offset-1 outline-[#f0b46c]/40")}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-muted">
        <span>
          <strong className="text-ink">{totalDone}</strong> tasks · goal hit on <strong className="text-ink">{goalDays}</strong> days
          {best && (
            <>
              {" "}
              · best day <strong className="text-ink">{best.n}</strong>
            </>
          )}
        </span>
        <span aria-hidden="true" className="flex items-center gap-1 font-mono text-[10px] uppercase">
          Less
          {fill.map((f, i) => (
            <span key={i} className="size-[11px] rounded-[3px]" style={{ background: i ? f : "rgb(17 17 17 / 0.12)" }} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
