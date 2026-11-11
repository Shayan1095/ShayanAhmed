"use client";

import { useState } from "react";
import { FormProvider, useController, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { SwitchField } from "@/components/admin/fields";
import { FormImage, FormSelect, FormText, FormTextArea, serverErrorToField } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { testimonialSchema } from "@/lib/admin/schemas";
import { saveTestimonial } from "../content-actions";

/** Form values: the input shape of the server schema (empty strings and nulls allowed). */
export type TestimonialDraft = z.input<typeof testimonialSchema>;
export const emptyTestimonial: TestimonialDraft = {
  name: "",
  role: "",
  company: "",
  quote: "",
  consent: false,
  published: false,
};
type Output = z.output<typeof testimonialSchema>;
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
  const form = useForm<TestimonialDraft, unknown, Output>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: { ...initial, projectSlug: initial.projectSlug ?? NONE },
    mode: "onTouched",
  });
  const {
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { isSubmitting },
  } = form;
  const [consent, published] = useWatch({ control, name: ["consent", "published"] });

  const onSubmit = handleSubmit(
    async (values) => {
      const res = await saveTestimonial(id, { ...values, projectSlug: values.projectSlug === NONE ? undefined : values.projectSlug });
      if (!res.ok) {
        const e = serverErrorToField(res.error);
        if (e.field) setError(e.field as keyof TestimonialDraft, { message: e.message }, { shouldFocus: true });
        return void toast.error(e.message);
      }
      toast.success(values.published && values.consent ? "Saved and live" : "Saved");
      onSaved();
    },
    () => toast.error("Some fields need attention. They're marked in red."),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormTextArea<TestimonialDraft> name="quote" label="Quote" hint="The client's exact words." required rows={4} />
        <div className="grid gap-4 sm:grid-cols-3">
          <FormText<TestimonialDraft> name="name" label="Name" required />
          <FormText<TestimonialDraft> name="role" label="Role" placeholder="e.g. Founder" />
          <FormText<TestimonialDraft> name="company" label="Company" />
        </div>
        <div className="flex flex-col gap-1.5">
          <FormSelect<TestimonialDraft>
            name="projectSlug"
            label="Linked project"
            options={[{ value: NONE, label: "None" }, ...projects.map((p) => ({ value: p.slug, label: p.title }))]}
          />
          <p className="text-[12.5px] text-muted">Also shows on that project&apos;s case study.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormText<TestimonialDraft> name="country" label="Country" placeholder="e.g. Pakistan" />
          <FormText<TestimonialDraft>
            name="sourceUrl"
            label="Link to the original review"
            placeholder="https://..."
          />
        </div>
        <StarRating />
        <FormImage<TestimonialDraft>
          name="photo"
          label="Photo (optional)"
          hint="Their profile picture. Without one, the site shows their initials."
          canUpload={canUpload}
        />
        <SwitchField
          label="The client agreed to publish this"
          hint="Required before it can go live."
          checked={consent}
          onChange={(v) => {
            setValue("consent", v, { shouldDirty: true });
            if (!v) setValue("published", false, { shouldDirty: true });
          }}
        />
        <SwitchField
          label="Published"
          hint={consent ? "Shows on the site." : "Turn on consent first."}
          checked={published}
          disabled={!consent}
          onChange={(v) => setValue("published", v, { shouldDirty: true })}
        />
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" size="lg" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

/**
 * Star rating, 1 to 5, as a radio group: click a star, or use the arrow keys.
 * "No rating" clears it (the site then shows no stars).
 */
function StarRating() {
  const { field } = useController<TestimonialDraft, "rating">({ name: "rating" });
  const value = Number(field.value) || 0;
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1 text-[13px] font-semibold">Rating</legend>
      <div className="flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Rating" className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              onMouseEnter={() => setHover(n)}
              className="grid size-10 cursor-pointer place-items-center rounded-md has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-copper"
            >
              <input
                type="radio"
                name="rating"
                value={n}
                checked={value === n}
                onChange={() => field.onChange(n)}
                className="sr-only"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              />
              <Star
                aria-hidden="true"
                className={n <= shown ? "size-6 fill-[#e8a33d] text-[#e8a33d]" : "size-6 text-paper-edge"}
              />
            </label>
          ))}
        </div>
        <span className="text-[13px] text-muted" aria-live="polite">
          {value ? `${value} out of 5` : "No rating"}
        </span>
        {value > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => field.onChange(undefined)}>
            Clear
          </Button>
        )}
      </div>
    </fieldset>
  );
}
