"use client";

import { useState, useTransition } from "react";
import {
  Archive,
  BellRing,
  Copy,
  FileText,
  Loader2,
  Mail,
  MailCheck,
  MessageCircle,
  Phone,
  StickyNote,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Undo2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { notifyShell } from "@/components/admin/shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { money, sourceLabel, stages } from "@/lib/admin/crm";
import { addDays, dayKey, dueKey } from "@/lib/admin/dates";
import type { Inquiry, LeadActivity, Stage } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { addLeadNote, deleteInquiry, updateLead } from "./actions";
import { StageDot } from "./board";

const statusLabel: Record<Inquiry["status"], string> = { new: "Unread", read: "Read", replied: "Replied", archived: "Archived" };

const activityIcon: Record<LeadActivity["kind"], typeof StickyNote> = {
  stage: TrendingUp,
  note: StickyNote,
  followup: BellRing,
  value: FileText,
  email: MailCheck,
  created: UserPlus,
};

const stamp = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * One lead, side panel: where it is in the pipeline, what it's worth, when to
 * follow up, and everything that happened (notes and changes, newest first).
 */
export function LeadPanel({
  lead: l,
  onChange,
  onStatus,
  onDeleted,
}: {
  lead: Inquiry;
  onChange: (l: Inquiry) => void;
  onStatus: (id: string, s: Inquiry["status"], note?: string) => void;
  onDeleted: () => void;
}) {
  const [pending, start] = useTransition();
  const [value, setValue] = useState(String(l.value || ""));
  const [note, setNote] = useState("");

  const patch = (p: Parameters<typeof updateLead>[1], ok?: string) =>
    start(async () => {
      const res = await updateLead(l.id, p);
      if (!res.ok || !res.data) return void toast.error(res.ok ? "Couldn't save" : res.error);
      onChange(res.data);
      notifyShell();
      if (ok) toast.success(ok);
    });

  const saveNote = () =>
    start(async () => {
      const res = await addLeadNote(l.id, note);
      if (!res.ok || !res.data) return void toast.error(res.ok ? "Couldn't save" : res.error);
      onChange(res.data);
      setNote("");
    });

  const today = dayKey();
  const follow = dueKey(l.followUpAt);
  const closed = l.stage === "won" || l.stage === "lost";
  const timeline = [...l.activity].reverse();

  return (
    <article className="flex min-h-full flex-col">
      <header className="flex flex-col gap-3 border-b border-paper-edge/50 p-5 pr-12">
        <div>
          <SheetTitle className="font-display text-[22px] font-extrabold leading-tight">{l.name}</SheetTitle>
          {l.company && <p className="text-[13.5px] font-medium">{l.company}</p>}
        </div>
        <SheetDescription asChild>
          <div className="flex flex-col gap-1 text-[13.5px] text-muted">
            {l.email && (
              <span className="flex items-center gap-2">
                <Mail className="size-3.5" aria-hidden="true" />
                {l.email}
                <button
                  type="button"
                  aria-label="Copy email"
                  className="cursor-pointer rounded p-1 hover:bg-paper-edge/35"
                  onClick={() => navigator.clipboard.writeText(l.email).then(() => toast.success("Email copied"))}
                >
                  <Copy className="size-3.5" />
                </button>
              </span>
            )}
            {l.phone && (
              <span className="flex items-center gap-2">
                <Phone className="size-3.5" aria-hidden="true" />
                {l.phone}
              </span>
            )}
            <span className="text-[12.5px]">
              {stamp(l.createdAt)} · {sourceLabel[l.source] ?? l.source}
            </span>
          </div>
        </SheetDescription>
        <div className="flex flex-wrap gap-1.5">
          {l.projectType && <Badge variant="secondary">{l.projectType}</Badge>}
          {l.budget && <Badge variant="secondary">{l.budget}</Badge>}
          <Badge variant="outline">{statusLabel[l.status]}</Badge>
        </div>
      </header>

      <div className="flex flex-col gap-6 p-5">
        {!l.emailed && (
          <p className="flex items-start gap-2 rounded-lg bg-warn/12 px-3 py-2 text-[12.5px] text-warn-ink">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            The email notification for this one wasn&apos;t sent (check the Resend settings). It&apos;s saved here.
          </p>
        )}

        {/* Stage */}
        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold">Stage</legend>
          <div role="radiogroup" aria-label="Stage" className="grid grid-cols-5 gap-1 rounded-xl border border-paper-edge/60 bg-paper/60 p-1">
            {stages.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={l.stage === s.id}
                disabled={pending}
                title={s.hint}
                onClick={() => l.stage !== s.id && patch({ stage: s.id as Stage }, `Moved to ${s.label}`)}
                className="flex cursor-pointer flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11.5px] font-semibold text-muted transition-colors hover:text-ink aria-checked:bg-ink aria-checked:text-paper"
              >
                <StageDot stage={s.id} />
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Value + follow-up */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lead-value" className="text-[13px] font-semibold">
              Deal value (USD)
            </label>
            <Input
              id="lead-value"
              type="number"
              min={0}
              step={50}
              inputMode="numeric"
              placeholder="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => Number(value || 0) !== l.value && patch({ value: Number(value || 0) }, "Value saved")}
              className="h-9 bg-paper"
            />
            <p className="text-[12px] text-muted">{l.value ? money(l.value) : "Estimate it to see your pipeline value"}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lead-follow" className="text-[13px] font-semibold">
              Follow up on
            </label>
            <Input
              id="lead-follow"
              type="date"
              disabled={closed || pending}
              value={follow ?? ""}
              onChange={(e) => patch({ followUpAt: e.target.value || null }, e.target.value ? "Follow-up set" : "Follow-up cleared")}
              className={cn("h-9 bg-paper", follow && follow <= today && !closed && "border-alert text-alert")}
            />
            {!closed && (
              <div className="flex flex-wrap gap-1">
                {[
                  { label: "Tomorrow", d: 1 },
                  { label: "In 3 days", d: 3 },
                  { label: "Next week", d: 7 },
                ].map((o) => (
                  <button
                    key={o.d}
                    type="button"
                    disabled={pending}
                    onClick={() => patch({ followUpAt: addDays(today, o.d) }, `Follow-up: ${o.label.toLowerCase()}`)}
                    className="cursor-pointer rounded-full border border-paper-edge/70 px-2 py-0.5 text-[11.5px] font-medium hover:border-copper hover:text-copper-ink"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Their message */}
        {l.message && (
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
              <MessageCircle className="size-3.5 text-copper-ink" aria-hidden="true" />
              {l.source === "website" ? "Their message" : "Notes when added"}
            </h3>
            <p className="whitespace-pre-wrap rounded-xl bg-paper/60 p-4 text-[14.5px] leading-relaxed">{l.message}</p>
          </section>
        )}

        {/* Timeline */}
        <section>
          <h3 className="mb-3 text-[13px] font-semibold">Timeline</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (note.trim()) saveNote();
            }}
            className="mb-4 flex flex-col gap-2"
          >
            <label htmlFor="lead-note" className="sr-only">
              Add a note
            </label>
            <Textarea
              id="lead-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && note.trim()) saveNote();
              }}
              placeholder="Add a note: call summary, what they said, next step…"
              className="min-h-16 bg-paper"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] text-muted">Ctrl + Enter to save</span>
              <Button type="submit" size="sm" variant="outline" disabled={!note.trim() || pending}>
                {pending ? <Loader2 className="animate-spin" /> : <StickyNote />} Add note
              </Button>
            </div>
          </form>
          <ol className="relative flex flex-col gap-3 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-paper-edge/60">
            {timeline.map((a) => {
              const Icon = activityIcon[a.kind];
              return (
                <li key={a.id} className="relative flex gap-3">
                  <span aria-hidden="true" className="surface relative z-[1] grid size-6 shrink-0 place-items-center rounded-full">
                    <Icon className="size-3 text-copper-ink" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[13.5px] leading-snug", a.kind === "note" && "whitespace-pre-wrap rounded-lg bg-paper/60 px-3 py-2")}>{a.text}</p>
                    <p className="mt-0.5 font-mono text-[10.5px] text-muted">{stamp(a.at)}</p>
                  </div>
                </li>
              );
            })}
            {l.source === "website" && (
              <li className="relative flex gap-3">
                <span aria-hidden="true" className="surface relative z-[1] grid size-6 shrink-0 place-items-center rounded-full">
                  <Mail className="size-3 text-copper-ink" />
                </span>
                <div>
                  <p className="text-[13.5px]">Enquiry received from the website</p>
                  <p className="mt-0.5 font-mono text-[10.5px] text-muted">{stamp(l.createdAt)}</p>
                </div>
              </li>
            )}
          </ol>
        </section>
      </div>

      <footer className="mt-auto flex flex-wrap items-center gap-2 border-t border-paper-edge/50 p-4">
        {l.email && (
          <a
            href={`mailto:${l.email}?subject=${encodeURIComponent("Re: your project enquiry")}`}
            className={buttonVariants({ size: "lg" })}
            onClick={() => l.status !== "replied" && onStatus(l.id, "replied")}
          >
            <Mail /> Reply by email
          </a>
        )}
        {l.status !== "replied" && l.status !== "archived" && (
          <Button variant="outline" size="lg" onClick={() => onStatus(l.id, "replied", "Marked as replied")}>
            <MailCheck /> Mark replied
          </Button>
        )}
        {l.status === "archived" ? (
          <Button variant="outline" size="lg" onClick={() => onStatus(l.id, "read", "Moved back to the pipeline")}>
            <Undo2 /> Unarchive
          </Button>
        ) : (
          <Button variant="outline" size="lg" onClick={() => onStatus(l.id, "archived", "Archived")}>
            <Archive /> Archive
          </Button>
        )}
        <div className="ml-auto">
          <ConfirmButton
            title="Delete this lead?"
            description={`${l.name} and their timeline are removed permanently. Archive instead to keep a record.`}
            confirmLabel="Delete"
            onConfirm={async () => {
              const res = await deleteInquiry(l.id);
              if (!res.ok) return void toast.error(res.error);
              toast.success("Deleted");
              notifyShell();
              onDeleted();
            }}
          >
            <Trash2 /> Delete
          </ConfirmButton>
        </div>
      </footer>
    </article>
  );
}
