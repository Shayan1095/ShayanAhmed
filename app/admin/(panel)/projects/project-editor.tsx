"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { FormSection, TextField } from "@/components/admin/fields";
import {
  FormImage,
  FormLines,
  FormRows,
  FormSelect,
  FormSwitch,
  FormText,
  FormTextArea,
  serverErrorToField,
  useUnsavedChangesWarning,
} from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { projectSchema, type ProjectInput } from "@/lib/admin/schemas";
import { deleteProject, saveProject } from "../content-actions";

type Form = Required<Pick<ProjectInput, "featured" | "hasCaseStudy" | "published">> & ProjectInput;
type Output = z.output<typeof projectSchema>;

export const emptyProject: Form = {
  slug: "",
  title: "",
  category: "website",
  status: "client",
  kind: "",
  summary: "",
  fact: "",
  stack: [],
  layers: { website: [], system: [], automation: [] },
  features: [],
  decisions: [],
  uiFragments: [],
  agents: [],
  results: [],
  gallery: [],
  featured: false,
  hasCaseStudy: false,
  published: false,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/**
 * Every field of a project, grouped by where it shows on the site.
 * React Hook Form tracks changes and validates each field as you leave it,
 * with the same zod schema the server checks on save.
 */
export function ProjectEditor({ id, initial, canUpload }: { id: string | null; initial: Form; canUpload: boolean }) {
  const router = useRouter();
  const form = useForm<Form, unknown, Output>({
    resolver: zodResolver(projectSchema),
    defaultValues: initial,
    mode: "onTouched",
  });
  const {
    handleSubmit,
    setValue,
    setError,
    reset,
    control,
    formState: { isDirty, isSubmitting, errors, submitCount },
  } = form;

  const onSubmit = handleSubmit(
    async (values) => {
      const res = await saveProject(id, values);
      if (!res.ok) {
        const e = serverErrorToField(res.error);
        if (e.field) setError(e.field as keyof Form, { message: e.message }, { shouldFocus: true });
        return void toast.error(e.message);
      }
      reset(form.getValues());
      toast.success(values.published ? "Saved and live on the site" : "Saved as a draft");
      if (!id && res.data) router.replace(`/admin/projects/${res.data}`);
      else router.refresh();
    },
    () => toast.error("Some fields need attention. They're marked in red."),
  );

  const errorCount = Object.keys(errors).length;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 pb-24">
        <Basics hasId={Boolean(id)} onTitle={(v, slugTouched) => !slugTouched && setValue("slug", slugify(v), { shouldDirty: true })} />

        <FormSection title="Images" description="Cover for cards; customer and owner views for the work slides and case study. The Screenshots tab is the quickest way to swap them.">
          <FormImage<Form> name="cover" label="Cover" canUpload={canUpload} />
          <FormImage<Form> name="customerView" label="Customer view" canUpload={canUpload} />
          <FormImage<Form> name="ownerView" label="Owner view" canUpload={canUpload} />
        </FormSection>

        <FormSection title="Three layers" description="What the build includes at each layer. Shown on the work slides and case study.">
          <div className="grid gap-4 md:grid-cols-3">
            <FormLines<Form> name="layers.website" label="Website" />
            <FormLines<Form> name="layers.system" label="System" />
            <FormLines<Form> name="layers.automation" label="Automation" />
          </div>
          <FormRows<Form, { title: string; text: string }>
            name="features"
            label="Features"
            empty={{ title: "", text: "" }}
            columns={[
              { key: "title", label: "Feature" },
              { key: "text", label: "What it does (optional)" },
            ]}
          />
          <FormRows<Form, { tag: string; text: string }>
            name="uiFragments"
            label="UI fragments"
            hint="Small live-looking notifications shown beside the project."
            max={6}
            empty={{ tag: "", text: "" }}
            columns={[
              { key: "tag", label: "Source" },
              { key: "text", label: "Message" },
            ]}
          />
          <FormRows<Form, { name: string; status: string; needsYou: boolean }>
            name="agents"
            label="Owner dashboard agents"
            hint="Used when there is no owner-view screenshot. Mark the ones that need the owner."
            max={12}
            empty={{ name: "", status: "", needsYou: false }}
            columns={[
              { key: "name", label: "Agent" },
              { key: "status", label: "Status" },
              { key: "needsYou", label: "Needs you", kind: "switch" },
            ]}
          />
        </FormSection>

        <CaseStudy />

        <FormSection title="Visibility">
          <FormSwitch<Form> name="published" label="Published" hint="Drafts never show on the site." />
          <FormSwitch<Form> name="featured" label="Featured" hint="Large slide in Selected work instead of the archive." />
        </FormSection>

        <SaveBar
          id={id}
          control={control}
          isDirty={isDirty}
          saving={isSubmitting}
          errorCount={submitCount > 0 ? errorCount : 0}
          onDelete={async () => {
            if (!id) return;
            const res = await deleteProject(id);
            if (!res.ok) return void toast.error(res.error);
            toast.success("Project deleted");
            router.replace("/admin/projects");
          }}
        />
      </form>
    </FormProvider>
  );
}

function Basics({ hasId, onTitle }: { hasId: boolean; onTitle: (title: string, slugTouched: boolean) => void }) {
  const [slugTouched, setSlugTouched] = useState(hasId);
  const slug = useWatch<Form, "slug">({ name: "slug" });
  return (
    <FormSection title="Basics" description="Name, type and the one-line summary used on cards and the archive.">
      <div className="grid gap-4 sm:grid-cols-2">
        <TitleField onTitle={(v) => onTitle(v, slugTouched)} />
        <div onChangeCapture={() => setSlugTouched(true)}>
          <FormText<Form> name="slug" label="URL slug" required hint={slug ? `/work/${slug}` : "Lowercase words joined by dashes."} />
        </div>
        <FormSelect<Form>
          name="category"
          label="Category"
          options={[
            { value: "website", label: "Website" },
            { value: "system", label: "System" },
            { value: "automation", label: "Automation" },
            { value: "web-tool", label: "Web tool" },
          ]}
        />
        <FormSelect<Form>
          name="status"
          label="Status"
          options={[
            { value: "client", label: "Client project" },
            { value: "product", label: "Own product" },
            { value: "confidential", label: "Confidential" },
          ]}
        />
        <FormText<Form> name="statusLabel" label="Badge text (optional)" hint='Overrides the status badge, e.g. "Product build".' />
        <FormText<Form> name="kind" label="Kind" hint='Short line, e.g. "E-commerce + operations".' />
      </div>
      <FormTextArea<Form> name="summary" label="Summary" rows={3} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormText<Form> name="fact" label="Archive fact" hint="One fact on the archive card's screen." />
        <FormText<Form> name="monitorLabel" label="Monitor label" hint='e.g. "brandsattire · storefront".' />
        <FormText<Form> name="liveUrl" label="Live URL" type="url" placeholder="https://" />
        <FormText<Form> name="demoNote" label="Demo note" hint="Shown when there is no public link." />
      </div>
      <FormLines<Form> name="stack" label="Stack" rows={3} />
    </FormSection>
  );
}

/** Title also fills the slug until the slug is edited by hand. */
function TitleField({ onTitle }: { onTitle: (v: string) => void }) {
  return (
    <div onChange={(e) => onTitle((e.target as HTMLInputElement).value)}>
      <FormText<Form> name="title" label="Title" required />
    </div>
  );
}

function CaseStudy() {
  const slug = useWatch<Form, "slug">({ name: "slug" });
  return (
    <FormSection title="Case study" description="Turn on the case study page and fill in what is true. Empty fields stay hidden.">
      <FormSwitch<Form> name="hasCaseStudy" label="Has a case study page" hint={slug ? `/work/${slug}` : undefined} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormText<Form> name="client" label="Client" />
        <FormText<Form> name="role" label="Your role" />
        <FormText<Form> name="timeline" label="Timeline" placeholder="e.g. 6 weeks" />
        <FormText<Form> name="outcome" label="Outcome" hint="One line with a real result." />
      </div>
      <FormTextArea<Form> name="problem" label="The problem" rows={4} />
      <FormRows<Form, { title: string; text: string }>
        name="decisions"
        label="Key decisions"
        max={12}
        empty={{ title: "", text: "" }}
        columns={[
          { key: "title", label: "Decision" },
          { key: "text", label: "Why", kind: "textarea" },
        ]}
      />
      <FormRows<Form, { label: string; value: string }>
        name="results"
        label="Results"
        hint="Only real figures."
        max={8}
        empty={{ label: "", value: "" }}
        columns={[
          { key: "value", label: "Figure", placeholder: "e.g. 10 min" },
          { key: "label", label: "Label", placeholder: "e.g. daily order checks" },
        ]}
      />
      <VideoFields />
    </FormSection>
  );
}

/** The video is optional as a whole: clearing its URL removes it. */
function VideoFields() {
  const video = useWatch<Form, "video">({ name: "video" });
  const { setValue, formState } = useFormContextSafe();
  const err = (formState.errors.video as { src?: { message?: string } } | undefined)?.src?.message;
  const set = (patch: Partial<NonNullable<Form["video"]>>) => {
    const next = { src: "", ...video, ...patch };
    setValue("video", next.src ? next : undefined, { shouldDirty: true, shouldValidate: formState.submitCount > 0 });
  };
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <TextField label="Video URL" hint="mp4 or webm." error={err} value={video?.src} onChange={(v) => set({ src: v })} />
      <TextField label="Video poster" value={video?.poster} disabled={!video?.src} onChange={(v) => set({ poster: v })} />
      <TextField label="Video caption" value={video?.caption} disabled={!video?.src} onChange={(v) => set({ caption: v })} />
    </div>
  );
}

function useFormContextSafe() {
  return useFormContext<Form>();
}

function SaveBar({
  id,
  control,
  isDirty,
  saving,
  errorCount,
  onDelete,
}: {
  id: string | null;
  control: ReturnType<typeof useForm<Form, unknown, Output>>["control"];
  isDirty: boolean;
  saving: boolean;
  errorCount: number;
  onDelete: () => Promise<void>;
}) {
  useUnsavedChangesWarning();
  const [title, slug, published, hasCaseStudy] = useWatch({ control, name: ["title", "slug", "published", "hasCaseStudy"] });
  const status = errorCount
    ? `${errorCount} ${errorCount === 1 ? "field needs" : "fields need"} attention`
    : isDirty
      ? "Unsaved changes"
      : "All changes saved";
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-paper-edge/70 bg-paper-hi/95 backdrop-blur lg:left-[232px]">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <span
            aria-hidden="true"
            className={
              errorCount ? "size-2 rounded-full bg-destructive" : isDirty ? "size-2 rounded-full bg-copper" : "size-2 rounded-full bg-[#5d7a4a]"
            }
          />
          <span role="status" className={errorCount ? "font-medium text-destructive" : undefined}>
            {status}
          </span>
          {id && published && hasCaseStudy && (
            <Link href={`/work/${slug}`} target="_blank" className="ml-2 inline-flex items-center gap-1 underline underline-offset-4">
              View <ExternalLink className="size-3" />
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          {id && (
            <ConfirmButton
              title={`Delete ${title || "this project"}?`}
              description="It disappears from the site straight away, with its uploaded screenshots. This can't be undone."
              confirmLabel="Delete project"
              onConfirm={onDelete}
            >
              <Trash2 /> Delete
            </ConfirmButton>
          )}
          <Button type="submit" size="lg" disabled={saving || (Boolean(id) && !isDirty)}>
            {saving && <Loader2 className="animate-spin" />}
            {id ? "Save changes" : "Create project"}
          </Button>
        </div>
      </div>
    </div>
  );
}
