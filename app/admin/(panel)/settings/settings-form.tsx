"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormSection } from "@/components/admin/fields";
import {
  FormImage,
  FormLines,
  FormRows,
  FormText,
  serverErrorToField,
  useUnsavedChangesWarning,
} from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { settingsSchema, type SettingsInput } from "@/lib/admin/schemas";
import { saveSettings } from "../content-actions";

type Output = z.output<typeof settingsSchema>;

/** The facts about you shown across the site. Each field is checked as you leave it. */
export function SettingsForm({ initial, canUpload }: { initial: SettingsInput; canUpload: boolean }) {
  const form = useForm<SettingsInput, unknown, Output>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
    mode: "onTouched",
  });
  const {
    handleSubmit,
    reset,
    setError,
    formState: { isDirty, isSubmitting },
  } = form;

  const onSubmit = handleSubmit(
    async (values) => {
      const res = await saveSettings(values);
      if (!res.ok) {
        const e = serverErrorToField(res.error);
        if (e.field) setError(e.field as keyof SettingsInput, { message: e.message }, { shouldFocus: true });
        return void toast.error(e.message);
      }
      reset(form.getValues());
      toast.success("Settings saved and live");
    },
    () => toast.error("Some fields need attention. They're marked in red."),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Warn />
        <FormSection title="Availability" description="Shown beside the status light in the navbar and footer.">
          <FormText<SettingsInput> name="availability" label="Availability line" required placeholder="e.g. Booking for December" />
        </FormSection>

        <FormSection title="Contact" description="Contact section lines and the Book a call button.">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormText<SettingsInput> name="email" label="Email" type="email" />
            <FormText<SettingsInput> name="linkedin" label="LinkedIn URL" type="url" placeholder="https://linkedin.com/in/…" />
            <FormText<SettingsInput>
              name="bookingUrl"
              label="Booking link"
              type="url"
              hint="Calendly or Cal.com. Adds a Book a call button."
            />
            <FormText<SettingsInput>
              name="startingPrice"
              label="Starting price"
              hint='Shows "Projects usually start from …".'
              placeholder="e.g. $1,500"
            />
          </div>
        </FormSection>

        <FormSection title="Contact form options" description="The choices visitors pick from. The budget field stays hidden while empty.">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormLines<SettingsInput> name="projectTypes" label="Project types" />
            <FormLines<SettingsInput> name="budgetRanges" label="Budget ranges" />
          </div>
        </FormSection>

        <FormSection title="About" description="Your portrait and the spec sheet beside it. Only true values.">
          <FormImage<SettingsInput> name="portrait" label="Portrait" canUpload={canUpload} />
          <FormRows<SettingsInput, { label: string; value: string }>
            name="specSheet"
            label="Spec sheet"
            max={12}
            empty={{ label: "", value: "" }}
            columns={[
              { key: "label", label: "Label", placeholder: "e.g. Shipped" },
              { key: "value", label: "Value", placeholder: "e.g. 8 projects" },
            ]}
          />
        </FormSection>

        <div className="sticky bottom-4 flex items-center justify-end gap-3 surface rounded-2xl/95 p-3 backdrop-blur">
          <span role="status" className="text-[13px] text-muted">
            {isDirty ? "Unsaved changes" : "All changes saved"}
          </span>
          <Button type="submit" size="lg" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Save settings
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

function Warn() {
  useUnsavedChangesWarning();
  return null;
}
