"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { TextAreaField, TextField } from "@/components/admin/fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Faq } from "@/lib/content/types";
import { deleteFaq, reorderFaqs, saveFaq } from "../content-actions";

type Row = Faq & { dirty?: boolean; isNew?: boolean };

/** Inline editor: each question saves on its own, so a half-written answer never blocks the rest. */
export function FaqManager({ initial }: { initial: Faq[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [, start] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);

  const patch = (id: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p, dirty: true } : r)));

  const save = (r: Row) => {
    setSavingId(r.id);
    start(async () => {
      const res = await saveFaq(r.isNew ? null : r.id, { question: r.question, answer: r.answer, published: r.published });
      setSavingId(null);
      if (!res.ok) return void toast.error(res.error);
      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, id: res.data ?? x.id, dirty: false, isNew: false } : x)));
      toast.success(r.published && r.answer.trim() ? "Saved and live" : "Saved");
    });
  };

  const move = (i: number, d: -1 | 1) => {
    const next = [...rows];
    const [r] = next.splice(i, 1);
    next.splice(i + d, 0, r);
    setRows(next);
    const ids = next.filter((x) => !x.isNew).map((x) => x.id);
    start(async () => {
      const res = await reorderFaqs(ids);
      if (!res.ok) toast.error(res.error);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {rows.map((r, i) => (
        <form
          key={r.id}
          onSubmit={(e) => {
            e.preventDefault();
            save(r);
          }}
          className="flex flex-col gap-3 rounded-xl border border-paper-edge/70 bg-paper-hi p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] text-muted">{String(i + 1).padStart(2, "0")}</span>
              {r.published && r.answer.trim() ? (
                <Badge>Live</Badge>
              ) : r.published ? (
                <Badge variant="outline">Needs an answer</Badge>
              ) : (
                <Badge variant="outline">Hidden</Badge>
              )}
              {r.dirty && <span className="text-[12px] text-[#8a521a]">Unsaved</span>}
            </div>
            <div className="flex items-center gap-0.5">
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={i === 0 || r.isNew} onClick={() => move(i, -1)}>
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move down"
                disabled={i === rows.length - 1 || r.isNew}
                onClick={() => move(i, 1)}
              >
                <ArrowDown />
              </Button>
              <ConfirmButton
                size="icon-sm"
                label={`Delete question ${i + 1}`}
                title="Delete this question?"
                description="It is removed from the site. This can't be undone."
                confirmLabel="Delete"
                onConfirm={async () => {
                  if (!r.isNew) {
                    const res = await deleteFaq(r.id);
                    if (!res.ok) return void toast.error(res.error);
                  }
                  setRows((rs) => rs.filter((x) => x.id !== r.id));
                }}
              >
                <Trash2 />
              </ConfirmButton>
            </div>
          </div>
          <TextField label="Question" required value={r.question} onChange={(v) => patch(r.id, { question: v })} />
          <TextAreaField label="Answer" rows={3} value={r.answer} onChange={(v) => patch(r.id, { answer: v })} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-[13.5px]">
              <Switch checked={r.published} onCheckedChange={(v) => patch(r.id, { published: v })} />
              Published
            </label>
            <Button type="submit" size="sm" disabled={!r.dirty || savingId === r.id}>
              {savingId === r.id && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      ))}
      <Button
        variant="outline"
        size="lg"
        className="self-start"
        onClick={() =>
          setRows((rs) => [
            ...rs,
            { id: `new-${Date.now()}`, question: "", answer: "", published: false, order: rs.length + 1, isNew: true, dirty: true },
          ])
        }
      >
        <Plus /> Add question
      </Button>
    </div>
  );
}
