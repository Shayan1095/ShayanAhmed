"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Pencil, Quote, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Testimonial } from "@/lib/content/types";
import { deleteTestimonial, reorderTestimonials } from "../content-actions";
import { TestimonialForm, type TestimonialDraft } from "./testimonial-form";

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
  const [editing, setEditing] = useState<{ id: string; draft: TestimonialDraft } | null>(null);
  const [, start] = useTransition();

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

  return (
    <>
      {items.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-paper-edge bg-paper-hi p-6">
          <Quote className="size-5 text-[#8a521a]" aria-hidden="true" />
          <p className="font-semibold">No testimonials yet</p>
          <p className="text-[14px] text-muted">The section stays hidden on the site until one is published.</p>
          <Link href="/admin/testimonials/new" className="text-[14px] font-semibold underline underline-offset-4">
            Add your first testimonial
          </Link>
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
            <DialogTitle>Edit testimonial</DialogTitle>
            <DialogDescription>Use the client&apos;s exact words.</DialogDescription>
          </DialogHeader>
          {editing && (
            <TestimonialForm
              key={editing.id}
              id={editing.id}
              initial={editing.draft}
              projects={projects}
              canUpload={canUpload}
              onCancel={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
