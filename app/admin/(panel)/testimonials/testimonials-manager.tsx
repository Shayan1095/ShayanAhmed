"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Quote, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ImageField, SwitchField, TextAreaField, TextField } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ImageRef, Testimonial } from "@/lib/content/types";
import { deleteTestimonial, reorderTestimonials, saveTestimonial } from "../content-actions";

type Draft = {
  name: string;
  role: string;
  company: string;
  quote: string;
  projectSlug?: string;
  photo?: ImageRef;
  consent: boolean;
  published: boolean;
};
const empty: Draft = { name: "", role: "", company: "", quote: "", consent: false, published: false };
const NONE = "__none";

/** Quotes from clients. Consent is required before one can be published. */
export function TestimonialsManager({
  initial,
  projects,
  canUpload,
}: {
  initial: Testimonial[];
  projects: { slug: string; title: string }[];
  canUpload: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [pending, start] = useTransition();

  const move = (i: number, d: -1 | 1) => {
    const next = [...items];
    const [r] = next.splice(i, 1);
    next.splice(i + d, 0, r);
    setItems(next);
    start(async () => {
      const res = await reorderTestimonials(next.map((t) => t.id));
      if (!res.ok) toast.error(res.error);
    });
  };

  const save = () =>
    editing &&
    start(async () => {
      const res = await saveTestimonial(editing.id, editing.draft);
      if (!res.ok) return void toast.error(res.error);
      toast.success(editing.draft.published && editing.draft.consent ? "Saved and live" : "Saved");
      setEditing(null);
      router.refresh();
    });

  const d = editing?.draft;
  const setD = (patch: Partial<Draft>) => editing && setEditing({ ...editing, draft: { ...editing.draft, ...patch } });

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Quotes from clients, shown in the Testimonials section and on the linked case study. Each one needs the client's consent before it can go live."
        actions={
          <Button size="lg" onClick={() => setEditing({ id: null, draft: empty })}>
            <Plus /> New testimonial
          </Button>
        }
      />
      {items.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-paper-edge bg-paper-hi p-6">
          <Quote className="size-5 text-[#8a521a]" aria-hidden="true" />
          <p className="font-semibold">No testimonials yet</p>
          <p className="text-[14px] text-muted">The section stays hidden on the site until one is published.</p>
        </div>
      ) : (
        <ol className="grid gap-3">
          {items.map((t, i) => (
            <li key={t.id} className="flex gap-4 rounded-xl border border-paper-edge/70 bg-paper-hi p-4">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[15px]">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-1.5 text-[13px] text-muted">
                  {t.name}
                  {t.role && `, ${t.role}`}
                  {t.company && ` · ${t.company}`}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.published && t.consent ? <Badge>Live</Badge> : <Badge variant="outline">Draft</Badge>}
                  {!t.consent && (
                    <Badge variant="outline" className="gap-1 text-destructive">
                      <ShieldAlert className="size-3" /> No consent yet
                    </Badge>
                  )}
                  {t.projectSlug && <Badge variant="secondary">{projects.find((p) => p.slug === t.projectSlug)?.title ?? t.projectSlug}</Badge>}
                </div>
              </div>
              <div className="flex shrink-0 items-start gap-0.5">
                <Button variant="ghost" size="icon-sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit testimonial from ${t.name}`}
                  onClick={() =>
                    setEditing({
                      id: t.id,
                      draft: {
                        name: t.name,
                        role: t.role,
                        company: t.company,
                        quote: t.quote,
                        projectSlug: t.projectSlug,
                        photo: t.photo,
                        consent: t.consent,
                        published: t.published,
                      },
                    })
                  }
                >
                  <Pencil />
                </Button>
                <ConfirmButton
                  size="icon-sm"
                  label={`Delete testimonial from ${t.name}`}
                  title="Delete this testimonial?"
                  description={`The quote from ${t.name} is removed from the site. This can't be undone.`}
                  confirmLabel="Delete"
                  onConfirm={async () => {
                    const res = await deleteTestimonial(t.id);
                    if (!res.ok) return void toast.error(res.error);
                    setItems((xs) => xs.filter((x) => x.id !== t.id));
                    toast.success("Deleted");
                  }}
                >
                  <Trash2 />
                </ConfirmButton>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto bg-paper-hi sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit testimonial" : "New testimonial"}</DialogTitle>
            <DialogDescription>Use the client&apos;s exact words.</DialogDescription>
          </DialogHeader>
          {d && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
              className="flex flex-col gap-4"
            >
              <TextAreaField label="Quote" required rows={4} value={d.quote} onChange={(v) => setD({ quote: v })} />
              <div className="grid gap-4 sm:grid-cols-3">
                <TextField label="Name" required value={d.name} onChange={(v) => setD({ name: v })} />
                <TextField label="Role" value={d.role} onChange={(v) => setD({ role: v })} />
                <TextField label="Company" value={d.company} onChange={(v) => setD({ company: v })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold">Linked project</span>
                <Select value={d.projectSlug ?? NONE} onValueChange={(v) => setD({ projectSlug: v === NONE ? undefined : v })}>
                  <SelectTrigger aria-label="Linked project" className="h-9 w-full bg-paper">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[12.5px] text-muted">Also shows on that project&apos;s case study.</p>
              </div>
              <ImageField label="Photo (optional)" value={d.photo} onChange={(v) => setD({ photo: v })} canUpload={canUpload} />
              <SwitchField
                label="The client agreed to publish this"
                hint="Required before it can go live."
                checked={d.consent}
                onChange={(v) => setD({ consent: v, published: v ? d.published : false })}
              />
              <SwitchField
                label="Published"
                hint={d.consent ? "Shows on the site." : "Turn on consent first."}
                checked={d.published}
                disabled={!d.consent}
                onChange={(v) => setD({ published: v })}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending && <Loader2 className="animate-spin" />}
                  Save
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
