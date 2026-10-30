"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormSection, ImageField, LinesField, RowsField, TextField } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";
import type { SettingsInput } from "@/lib/admin/schemas";
import { saveSettings } from "../content-actions";

export function SettingsForm({ initial, canUpload }: { initial: SettingsInput; canUpload: boolean }) {
  const [f, setF] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof SettingsInput>(k: K, v: SettingsInput[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setDirty(true);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveSettings(f);
          if (!res.ok) return void toast.error(res.error);
          setDirty(false);
          toast.success("Settings saved and live");
        });
      }}
      className="flex flex-col gap-5"
    >
      <FormSection title="Availability" description="Shown beside the status light in the navbar and footer.">
        <TextField
          label="Availability line"
          required
          placeholder="e.g. Booking for December"
          value={f.availability}
          onChange={(v) => set("availability", v)}
        />
      </FormSection>

      <FormSection title="Contact" description="Contact section lines and the Book a call button.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Email" type="email" value={f.email} onChange={(v) => set("email", v)} />
          <TextField label="LinkedIn URL" type="url" placeholder="https://linkedin.com/in/…" value={f.linkedin} onChange={(v) => set("linkedin", v)} />
          <TextField
            label="Booking link"
            type="url"
            hint="Calendly or Cal.com. Adds a Book a call button."
            value={f.bookingUrl}
            onChange={(v) => set("bookingUrl", v)}
          />
          <TextField
            label="Starting price"
            hint='Shows "Projects usually start from …".'
            placeholder="e.g. $1,500"
            value={f.startingPrice}
            onChange={(v) => set("startingPrice", v)}
          />
        </div>
      </FormSection>

      <FormSection title="Contact form options" description="The choices visitors pick from. The budget field stays hidden while empty.">
        <div className="grid gap-4 sm:grid-cols-2">
          <LinesField label="Project types" value={f.projectTypes ?? []} onChange={(v) => set("projectTypes", v)} />
          <LinesField label="Budget ranges" value={f.budgetRanges ?? []} onChange={(v) => set("budgetRanges", v)} />
        </div>
      </FormSection>

      <FormSection title="About" description="Your portrait and the spec sheet beside it. Only true values.">
        <ImageField label="Portrait" value={f.portrait} onChange={(v) => set("portrait", v)} canUpload={canUpload} />
        <RowsField
          label="Spec sheet"
          max={12}
          rows={f.specSheet ?? []}
          onChange={(v) => set("specSheet", v)}
          empty={{ label: "", value: "" }}
          columns={[
            { key: "label", label: "Label", placeholder: "e.g. Shipped" },
            { key: "value", label: "Value", placeholder: "e.g. 8 projects" },
          ]}
        />
      </FormSection>

      <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-xl border border-paper-edge/70 bg-paper-hi/95 p-3 backdrop-blur">
        <span role="status" className="text-[13px] text-muted">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>
        <Button type="submit" size="lg" disabled={pending || !dirty}>
          {pending && <Loader2 className="animate-spin" />}
          Save settings
        </Button>
      </div>
    </form>
  );
}
