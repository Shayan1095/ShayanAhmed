"use client";

import { useState, useTransition } from "react";
import { Archive, ArrowLeft, Copy, Inbox, Mail, MailCheck, Trash2, TriangleAlert, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Inquiry } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { deleteInquiry, setInquiryStatus } from "./actions";

type Filter = "open" | "replied" | "archived";
const filterLabels: Record<Filter, string> = { open: "Waiting", replied: "Replied", archived: "Archived" };

const when = (iso: string) => {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

/** List and reading pane. Opening an enquiry marks it read; replying is one click to your mail app. */
export function InboxView({ initial }: { initial: Inquiry[] }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<Filter>("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [, start] = useTransition();

  const matches = (i: Inquiry, f: Filter) =>
    f === "open" ? i.status === "new" || i.status === "read" : i.status === f;
  const shown = items.filter((i) => matches(i, filter));
  const open = items.find((i) => i.id === openId) ?? null;

  const setStatus = (id: string, status: Inquiry["status"], note?: string) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status } : x)));
    start(async () => {
      const res = await setInquiryStatus(id, status);
      if (!res.ok) toast.error(res.error);
      else if (note) toast.success(note);
    });
  };

  const select = (i: Inquiry) => {
    setOpenId(i.id);
    if (i.status === "new") setStatus(i.id, "read");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div className={cn("flex flex-col gap-3", open && "hidden lg:flex")}>
        <div role="tablist" aria-label="Filter" className="inline-flex self-start rounded-lg border border-paper-edge/70 bg-paper-hi p-0.5">
          {(Object.keys(filterLabels) as Filter[]).map((f) => {
            const n = items.filter((i) => matches(i, f)).length;
            return (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-[13px] font-medium text-muted hover:text-ink aria-selected:bg-ink aria-selected:text-paper"
              >
                {filterLabels[f]}
                <span className="font-mono text-[11px] opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-paper-edge bg-paper-hi px-4 py-10 text-center">
            <Inbox className="size-5 text-muted" aria-hidden="true" />
            <p className="text-[14px] text-muted">
              {filter === "open" ? "No one is waiting on a reply." : `Nothing ${filterLabels[filter].toLowerCase()}.`}
            </p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-paper-edge/70 bg-paper-hi">
            {shown.map((i) => (
              <li key={i.id} className="border-b border-paper-edge/50 last:border-0">
                <button
                  type="button"
                  onClick={() => select(i)}
                  aria-current={openId === i.id || undefined}
                  className="flex w-full cursor-pointer flex-col gap-0.5 px-4 py-3 text-left hover:bg-paper-edge/20 aria-[current=true]:bg-paper-edge/30"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className={cn("flex items-center gap-2 truncate text-[14px]", i.status === "new" ? "font-bold" : "font-medium")}>
                      {i.status === "new" && <span aria-label="New" className="size-2 shrink-0 rounded-full bg-copper" />}
                      {i.name}
                    </span>
                    <span className="shrink-0 font-mono text-[11.5px] text-muted">{when(i.createdAt)}</span>
                  </span>
                  <span className="truncate text-[12.5px] text-muted">{[i.projectType, i.budget].filter(Boolean).join(" · ") || i.email}</span>
                  <span className="line-clamp-1 text-[13px] text-ink/70">{i.message}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={cn(!open && "hidden lg:block")}>
        {!open ? (
          <div className="grid h-full min-h-60 place-items-center rounded-xl border border-dashed border-paper-edge bg-paper-hi text-[14px] text-muted">
            Select an enquiry to read it.
          </div>
        ) : (
          <article className="rounded-xl border border-paper-edge/70 bg-paper-hi">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-paper-edge/60 p-5">
              <div>
                <Button variant="ghost" size="sm" className="-ml-2 mb-2 lg:hidden" onClick={() => setOpenId(null)}>
                  <ArrowLeft /> Back
                </Button>
                <h2 className="font-display text-[20px] font-extrabold">{open.name}</h2>
                <p className="flex items-center gap-2 text-[13.5px] text-muted">
                  {open.email}
                  <button
                    type="button"
                    aria-label="Copy email"
                    className="cursor-pointer rounded p-1 hover:bg-paper-edge/35"
                    onClick={() => navigator.clipboard.writeText(open.email).then(() => toast.success("Email copied"))}
                  >
                    <Copy className="size-3.5" />
                  </button>
                </p>
                <p className="mt-1 text-[12.5px] text-muted">
                  {new Date(open.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {open.projectType && <Badge variant="secondary">{open.projectType}</Badge>}
                {open.budget && <Badge variant="secondary">{open.budget}</Badge>}
                <Badge variant="outline">{open.status === "new" ? "New" : open.status[0].toUpperCase() + open.status.slice(1)}</Badge>
              </div>
            </header>
            {!open.emailed && (
              <p className="mx-5 mt-4 flex items-start gap-2 rounded-lg bg-[#b8901c]/12 px-3 py-2 text-[12.5px] text-[#6d5410]">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                The email notification for this one wasn&apos;t sent (check the Resend settings). It&apos;s saved here.
              </p>
            )}
            <p className="whitespace-pre-wrap p-5 text-[15px] leading-relaxed">{open.message}</p>
            <footer className="flex flex-wrap items-center gap-2 border-t border-paper-edge/60 p-4">
              <a
                href={`mailto:${open.email}?subject=${encodeURIComponent("Re: your project enquiry")}`}
                className={buttonVariants({ size: "lg" })}
                onClick={() => open.status !== "replied" && setStatus(open.id, "replied")}
              >
                <Mail /> Reply by email
              </a>
              {open.status !== "replied" && (
                <Button variant="outline" size="lg" onClick={() => setStatus(open.id, "replied", "Marked as replied")}>
                  <MailCheck /> Mark replied
                </Button>
              )}
              {open.status === "archived" ? (
                <Button variant="outline" size="lg" onClick={() => setStatus(open.id, "read", "Moved back to waiting")}>
                  <Undo2 /> Unarchive
                </Button>
              ) : (
                <Button variant="outline" size="lg" onClick={() => setStatus(open.id, "archived", "Archived")}>
                  <Archive /> Archive
                </Button>
              )}
              <div className="ml-auto">
                <ConfirmButton
                  title="Delete this enquiry?"
                  description={`The message from ${open.name} is removed permanently. Archive it instead to keep a record.`}
                  confirmLabel="Delete"
                  onConfirm={async () => {
                    const res = await deleteInquiry(open.id);
                    if (!res.ok) return void toast.error(res.error);
                    setItems((xs) => xs.filter((x) => x.id !== open.id));
                    setOpenId(null);
                    toast.success("Deleted");
                  }}
                >
                  <Trash2 /> Delete
                </ConfirmButton>
              </div>
            </footer>
          </article>
        )}
      </div>
    </div>
  );
}
