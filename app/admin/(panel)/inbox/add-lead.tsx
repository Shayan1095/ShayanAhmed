"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { FormSelect, FormText, FormTextArea } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { leadSources, sourceLabel, stages } from "@/lib/admin/crm";
import { newLeadSchema, type NewLeadInput } from "@/lib/admin/schemas";
import type { Inquiry } from "@/lib/admin/types";
import { createLead } from "./actions";

const blank: NewLeadInput = {
  name: "",
  email: "",
  phone: "",
  company: "",
  projectType: "",
  source: "whatsapp",
  value: 0,
  stage: "new",
  message: "",
};

/** Add a lead that didn't come through the website form (WhatsApp, LinkedIn, a referral). */
export function AddLeadDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (l: Inquiry) => void }) {
  const form = useForm<NewLeadInput, unknown, z.output<typeof newLeadSchema>>({
    resolver: zodResolver(newLeadSchema),
    defaultValues: blank,
    mode: "onTouched",
  });
  const { handleSubmit, formState, reset } = form;

  const submit = handleSubmit(async (data) => {
    const res = await createLead(data);
    if (!res.ok || !res.data) return void toast.error(res.ok ? "Couldn't add the lead" : res.error);
    toast.success(`${res.data.name} added`);
    onCreated(res.data);
    reset(blank);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-2xl p-6 sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-[20px] font-extrabold">
            <UserPlus className="size-5 text-copper-ink" aria-hidden="true" /> Add a lead
          </DialogTitle>
          <DialogDescription>For leads from WhatsApp, LinkedIn, email or referrals. Website enquiries arrive on their own.</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
            <FormText<NewLeadInput> name="name" label="Name" autoComplete="off" className="sm:col-span-2" />
            <FormText<NewLeadInput> name="email" label="Email" type="email" autoComplete="off" />
            <FormText<NewLeadInput> name="phone" label="Phone / WhatsApp" type="tel" autoComplete="off" />
            <FormText<NewLeadInput> name="company" label="Company" hint="Optional" />
            <FormText<NewLeadInput> name="projectType" label="What they need" hint="e.g. Online store" />
            <FormSelect<NewLeadInput> name="source" label="Source" options={leadSources.map((s) => ({ value: s, label: sourceLabel[s] }))} />
            <FormSelect<NewLeadInput> name="stage" label="Stage" options={stages.map((s) => ({ value: s.id, label: s.label }))} />
            <FormText<NewLeadInput> name="value" label="Deal value (USD)" type="number" min={0} step={50} inputMode="numeric" hint="Your estimate; 0 if unknown" />
            <div className="hidden sm:block" />
            <FormTextArea<NewLeadInput> name="message" label="Notes" hint="What they asked for, in their words" rows={3} className="sm:col-span-2" />
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? <Loader2 className="animate-spin" /> : <UserPlus />} Add lead
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
