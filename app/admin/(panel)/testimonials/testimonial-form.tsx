"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageField, SwitchField, TextAreaField, TextField } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ImageRef } from "@/lib/content/types";
import { saveTestimonial } from "../content-actions";

export type TestimonialDraft = {
  name: string;
  role: string;
  company: string;
  quote: string;
  projectSlug?: string;
  photo?: ImageRef;
  consent: boolean;
  published: boolean;
};
export const emptyTestimonial: TestimonialDraft = {
  name: "",
  role: "",
  company: "",
  quote: "",
  consent: false,
  published: false,
};
const NONE = "__none";

/** Add or edit one testimonial. Publishing is locked until the client's consent is ticked. */
export function TestimonialForm({
  id,
  initial,
  projects,
  canUpload,
  onSaved,
  onCancel,
  submitLabel = "Save",
}: {
  id: string | null;
  initial: TestimonialDraft;
  projects: { slug: string; title: string }[];
  canUpload: boolean;
  onSaved: () => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [d, setDraft] = useState(initial);
  const [pending, start] = useTransition();
  const setD = (patch: Partial<TestimonialDraft>) => setDraft((x) => ({ ...x, ...patch }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveTestimonial(id, d);
          if (!res.ok) return void toast.error(res.error);
          toast.success(d.published && d.consent ? "Saved and live" : "Saved");
          onSaved();
        });
      }}
      className="flex flex-col gap-4"
    >
      <TextAreaField label="Quote" hint="The client's exact words." required rows={4} value={d.quote} onChange={(v) => setD({ quote: v })} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Name" required value={d.name} onChange={(v) => setD({ name: v })} />
        <TextField label="Role" placeholder="e.g. Founder" value={d.role} onChange={(v) => setD({ role: v })} />
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
        {onCancel && (
          <Button type="button" variant="outline" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
