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
import { FormSection, ImageField, TextField } from "@/components/admin/fields";
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
  screens: [],
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
          <FormImage<Form>
            name="poster"
            label="Poster"
            hint="First frame of the recording (WebP, 1440x900). Shown before a video plays and on every card. Without one, the customer view or cover stands in."
            canUpload={canUpload}
          />
          <FormImage<Form> name="cover" label="Cover" canUpload={canUpload} />
          <FormImage<Form> name="customerView" label="Customer view" canUpload={canUpload} />
          <FormImage<Form> name="ownerView" label="Owner view" canUpload={canUpload} />
        </FormSection>

        <FormSection
          title="Recordings"
          description="Screen recordings play muted in the project frame while it is on screen (never with reduced motion or Data Saver). Paste links to the files: a full https:// URL (for example Cloudinary) or a path in /public. Give both formats when you can; browsers pick WebM first."
        >
          <VideoFields />
          <SourcesFields name="videoCustomer" title="Customer view recording" hint="For projects with the Customer view / Owner view toggle." />
          <SourcesFields name="videoOwner" title="Owner view recording" />
        </FormSection>

        <FormSection title="Screens" description="Captioned screenshots for the case study gallery (2880x1800 WebP, three to six). Tag each with the side it shows.">
          <ScreensField canUpload={canUpload} />
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
      <FormTextArea<Form> name="problem" label="The problem" hint="What was slow, manual or broken, in the client's terms." rows={4} />
      <FormLines<Form> name="weakPoints" label="Weak points of the old way" hint="A short list, one per line." />
      <FormRows<Form, { title: string; text: string; tradeoff: string }>
        name="decisions"
        label="Key decisions"
        hint="Two to four, each with what it cost."
        max={12}
        empty={{ title: "", text: "", tradeoff: "" }}
        columns={[
          { key: "title", label: "Decision" },
          { key: "text", label: "Why", kind: "textarea" },
          { key: "tradeoff", label: "Trade-off (what it cost)", kind: "textarea" },
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
      <FormTextArea<Form>
        name="proves"
        label="What this build proves"
        hint="For product and demo builds (no client results): what the build shows you can do. Shown with a plain note that it is a product build."
        rows={3}
      />
      <FormLines<Form> name="nextSteps" label="What I'd do next" hint="A short list, one per line." />
    </FormSection>
  );
}

/** The main recording is optional as a whole: clearing every link removes it. */
function VideoFields() {
  const video = useWatch<Form, "video">({ name: "video" });
  const { setValue, formState } = useFormContextSafe();
  const errors = formState.errors.video as Record<string, { message?: string } | undefined> | undefined;
  const set = (patch: Partial<NonNullable<Form["video"]>>) => {
    const next = { ...video, ...patch };
    const has = Boolean(next.mp4 || next.webm || next.src);
    setValue("video", has ? next : undefined, { shouldDirty: true, shouldValidate: formState.submitCount > 0 });
  };
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1.5 text-[13px] font-semibold">Main recording</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="MP4 link"
          hint="H.264, under 2 MB."
          error={errors?.mp4?.message ?? errors?.src?.message}
          value={video?.mp4 ?? video?.src}
          onChange={(v) => set({ mp4: v, src: undefined })}
        />
        <TextField label="WebM link" error={errors?.webm?.message} value={video?.webm} onChange={(v) => set({ webm: v })} />
      </div>
      <TextField label="Caption" hint="One line under the walkthrough on the case study." value={video?.caption} onChange={(v) => set({ caption: v })} />
    </fieldset>
  );
}

/** A recording with an MP4 and a WebM link (the customer and owner sides). */
function SourcesFields({ name, title, hint }: { name: "videoCustomer" | "videoOwner"; title: string; hint?: string }) {
  const value = useWatch<Form, typeof name>({ name });
  const { setValue, formState } = useFormContextSafe();
  const errors = formState.errors[name] as Record<string, { message?: string } | undefined> | undefined;
  const set = (patch: { mp4?: string; webm?: string }) => {
    const next = { ...value, ...patch };
    setValue(name, next.mp4 || next.webm ? next : undefined, { shouldDirty: true, shouldValidate: formState.submitCount > 0 });
  };
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1.5 text-[13px] font-semibold">{title}</legend>
      {hint && <p className="-mt-1 text-[12.5px] text-muted">{hint}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="MP4 link" error={errors?.mp4?.message} value={value?.mp4} onChange={(v) => set({ mp4: v })} />
        <TextField label="WebM link" error={errors?.webm?.message} value={value?.webm} onChange={(v) => set({ webm: v })} />
      </div>
    </fieldset>
  );
}

type ScreenRow = NonNullable<Form["screens"]>[number];

/** Screens: each an uploaded image, a one-line caption and the side it shows. */
function ScreensField({ canUpload }: { canUpload: boolean }) {
  const screens = (useWatch<Form, "screens">({ name: "screens" }) ?? []) as ScreenRow[];
  const { setValue, formState } = useFormContextSafe();
  const rowErrors = formState.errors.screens as unknown as
    | Record<string, { caption?: { message?: string } } | undefined>
    | undefined;
  const save = (next: ScreenRow[]) => setValue("screens", next, { shouldDirty: true, shouldValidate: formState.submitCount > 0 });
  const update = (i: number, patch: Partial<ScreenRow>) => save(screens.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...screens];
    const [row] = next.splice(i, 1);
    next.splice(i + d, 0, row);
    save(next);
  };
  return (
    <div className="flex flex-col gap-3">
      {screens.length === 0 && <p className="text-[13px] text-muted">No screens yet.</p>}
      <ol className="flex flex-col gap-3">
        {screens.map((row, i) => (
          <li key={i} className="flex flex-col gap-3 rounded-lg border border-paper-edge/60 bg-paper p-3">
            <ImageField label={`Screen ${i + 1}`} value={row.image} canUpload={canUpload} onChange={(image) => image && update(i, { image })} />
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <TextField label="Caption" error={rowErrors?.[i]?.caption?.message} value={row.caption} onChange={(caption) => update(i, { caption })} />
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                Side
                <select
                  value={row.view}
                  onChange={(e) => update(i, { view: e.target.value as ScreenRow["view"] })}
                  className="h-10 rounded-lg border border-paper-edge bg-paper-hi px-3 text-[14px] font-normal"
                >
                  <option value="customer">Customer view</option>
                  <option value="owner">Owner view</option>
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" disabled={i === 0} onClick={() => move(i, -1)}>
                Move up
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={i === screens.length - 1} onClick={() => move(i, 1)}>
                Move down
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => save(screens.filter((_, j) => j !== i))}>
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ol>
      {screens.length < 12 && (
        <ImageField
          label="Add a screen"
          hint="Upload an image; then add its caption."
          value={undefined}
          canUpload={canUpload}
          onChange={(image) => image && save([...screens, { image, caption: "", view: "customer" }])}
        />
      )}
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
              errorCount ? "size-2 rounded-full bg-destructive" : isDirty ? "size-2 rounded-full bg-copper" : "size-2 rounded-full bg-good-mark"
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
