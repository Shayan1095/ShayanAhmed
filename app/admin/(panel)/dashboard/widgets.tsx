"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowUpRight, BellRing, CircleCheck, CircleDashed, FileText, Inbox, ListChecks, MailCheck, StickyNote, TrendingUp, UserPlus } from "lucide-react";
import { ago } from "@/lib/admin/crm";
import { dayKey, dueKey, dueLabel } from "@/lib/admin/dates";
import type { HealthCheck } from "@/lib/admin/health";
import type { FeedItem } from "@/lib/admin/metrics";
import type { Inquiry } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};
const useClient = () => useSyncExternalStore(subscribe, () => true, () => false);

/** "Good evening" in your own time zone, with today's date. */
export function Greeting() {
  const client = useClient();
  if (!client) return <span>Today</span>;
  const h = new Date().getHours();
  const part = h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return (
    <span>
      {part} · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
    </span>
  );
}

type Row = Pick<Inquiry, "id" | "name" | "company" | "projectType" | "createdAt" | "followUpAt" | "value" | "stage">;

/** Who needs you: leads waiting for a first reply, then follow-ups due today or overdue (your local day). */
export function Attention({ waiting, followUps }: { waiting: Row[]; followUps: Row[] }) {
  const client = useClient();
  const today = client ? dayKey() : "";
  const due = client ? followUps.filter((l) => (dueKey(l.followUpAt) ?? "9999") <= today) : [];
  const items = [
    ...waiting.map((l) => ({ l, tag: `Waiting ${ago(l.createdAt)}`, tone: "copper" as const, icon: Inbox })),
    ...due.map((l) => ({ l, tag: dueLabel(l.followUpAt, today)?.text ?? "Follow up", tone: "alert" as const, icon: BellRing })),
  ];
  if (items.length === 0)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
        <CircleCheck className="size-6 text-good" aria-hidden="true" />
        <p className="text-[14px] font-semibold">You&apos;re all caught up</p>
        <p className="max-w-[30ch] text-[13px] text-muted">New enquiries and follow-ups you schedule on a lead show up here.</p>
      </div>
    );
  return (
    <ul className="-mx-2 flex flex-col">
      {items.slice(0, 6).map(({ l, tag, tone, icon: Icon }) => (
        <li key={`${tone}-${l.id}`}>
          <Link href={`/admin/inbox?lead=${l.id}`} className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-paper-edge/25">
            <span
              aria-hidden="true"
              className={cn("grid size-8 shrink-0 place-items-center rounded-full", tone === "alert" ? "bg-alert/12 text-alert" : "bg-copper/15 text-copper-ink")}
            >
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold">{l.name}</span>
              <span className="block truncate text-[12.5px] text-muted">{[l.company, l.projectType].filter(Boolean).join(" · ") || "No details yet"}</span>
            </span>
            <span className={cn("shrink-0 text-[12px] font-semibold", tone === "alert" ? "text-alert" : "text-copper-ink")}>{tag}</span>
            <ArrowUpRight className="size-4 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Brutal segmented meter: one block per check (solid = done), plus the open items as links. */
export function HealthList({ checks }: { checks: HealthCheck[] }) {
  const ok = checks.filter((c) => c.ok).length;
  const pct = Math.round((ok / checks.length) * 100);
  const todo = checks.filter((x) => !x.ok);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="flex items-end gap-2">
          <span className="font-display text-[48px] font-extrabold leading-[0.8] tracking-[-0.04em]">{pct}%</span>
          <span className="pb-0.5 font-mono text-[10.5px] uppercase leading-tight tracking-[0.12em] text-muted">
            {ok}/{checks.length}
            <br />
            done
          </span>
        </p>
        <div role="img" aria-label={`Site ${pct}% complete: ${ok} of ${checks.length} checks done`} className="mt-3 flex gap-1">
          {checks.map((c) => (
            <span
              key={c.id}
              title={c.label}
              className={cn("h-5 flex-1 border-2 border-[var(--brutal-line)]", c.ok ? "bg-chart" : "bg-paper [background-image:var(--brutal-hatch)] opacity-70")}
            />
          ))}
        </div>
        <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">
          {todo.length ? "Fix these to win more clients" : "The site is complete"}
        </p>
      </div>
      <ul className="-mx-2 flex flex-col">
        {(todo.length ? todo : checks).slice(0, 5).map((x) => (
          <li key={x.id}>
            <Link href={x.href} className="group flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-paper-edge/25">
              {x.ok ? (
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-good" aria-hidden="true" />
              ) : (
                <CircleDashed className="mt-0.5 size-4 shrink-0 text-copper-ink" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1 text-[13px] leading-snug">
                <span className="block font-medium group-hover:underline">{x.label}</span>
                {!x.ok && <span className="block text-[12px] text-muted">{x.fix}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const feedIcon = {
  lead: UserPlus,
  stage: TrendingUp,
  note: StickyNote,
  task: ListChecks,
  followup: BellRing,
  value: FileText,
  email: MailCheck,
} as const;

export function Feed({ items }: { items: FeedItem[] }) {
  const client = useClient();
  if (items.length === 0) return <p className="py-6 text-center text-[13px] text-muted">Activity on leads and tasks appears here.</p>;
  return (
    <ol className="relative flex flex-col gap-3.5 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-paper-edge/60">
      {items.map((it) => {
        const Icon = feedIcon[it.kind];
        return (
          <li key={it.id} className="relative flex items-start gap-3">
            <span aria-hidden="true" className="surface relative z-[1] grid size-[27px] shrink-0 place-items-center rounded-full">
              <Icon className="size-3.5 text-copper-ink" />
            </span>
            <Link href={it.href} className="min-w-0 flex-1 pt-0.5 text-[13px] leading-snug hover:underline">
              <span className="line-clamp-2">{it.text}</span>
            </Link>
            <span className="shrink-0 pt-0.5 font-mono text-[11px] text-muted">{client ? ago(it.at) : ""}</span>
          </li>
        );
      })}
    </ol>
  );
}
