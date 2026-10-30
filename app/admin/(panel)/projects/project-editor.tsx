"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/admin/confirm-button";
import {
  FormSection,
  ImageField,
  LinesField,
  RowsField,
  SwitchField,
  TextAreaField,
  TextField,
} from "@/components/admin/fields";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProjectInput } from "@/lib/admin/schemas";
import { deleteProject, saveProject } from "../content-actions";

type Form = Required<Pick<ProjectInput, "featured" | "hasCaseStudy" | "published">> & ProjectInput;

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

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold">{label}</span>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger aria-label={label} className="h-9 w-full bg-paper">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Every field of a project, grouped by where it shows on the site. */
export function ProjectEditor({ id, initial, canUpload }: { id: string | null; initial: Form; canUpload: boolean }) {
  const router = useRouter();
  const [f, setF] = useState<Form>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, start] = useTransition();
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setDirty(true);
  };

  const save = () =>
    start(async () => {
      const res = await saveProject(id, f);
      if (!res.ok) return void toast.error(res.error);
      setDirty(false);
      toast.success(f.published ? "Saved and live on the site" : "Saved as a draft");
      if (!id && res.data) router.replace(`/admin/projects/${res.data}`);
      else router.refresh();
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-5 pb-24"
    >
      <FormSection title="Basics" description="Name, type and the one-line summary used on cards and the archive.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Title"
            required
            value={f.title}
            onChange={(v) => {
              set("title", v);
              if (!slugTouched) set("slug", slugify(v));
            }}
          />
          <TextField
            label="URL slug"
            hint={f.slug ? `/work/${f.slug}` : "Lowercase words joined by dashes."}
            required
            value={f.slug}
            onChange={(v) => {
              setSlugTouched(true);
              set("slug", v);
            }}
          />
          <SelectField
            label="Category"
            value={f.category}
            onChange={(v) => set("category", v)}
            options={[
              { value: "website", label: "Website" },
              { value: "system", label: "System" },
              { value: "automation", label: "Automation" },
              { value: "web-tool", label: "Web tool" },
            ]}
          />
          <SelectField
            label="Status"
            value={f.status}
            onChange={(v) => set("status", v)}
            options={[
              { value: "client", label: "Client project" },
              { value: "product", label: "Own product" },
              { value: "confidential", label: "Confidential" },
            ]}
          />
          <TextField label="Badge text (optional)" hint='Overrides the status badge, e.g. "Product build".' value={f.statusLabel} onChange={(v) => set("statusLabel", v)} />
          <TextField label="Kind" hint='Short line, e.g. "E-commerce + operations".' value={f.kind} onChange={(v) => set("kind", v)} />
        </div>
        <TextAreaField label="Summary" rows={3} value={f.summary} onChange={(v) => set("summary", v)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Archive fact" hint="One fact on the archive card's screen." value={f.fact} onChange={(v) => set("fact", v)} />
          <TextField label="Monitor label" hint='e.g. "brandsattire · storefront".' value={f.monitorLabel} onChange={(v) => set("monitorLabel", v)} />
          <TextField label="Live URL" type="url" placeholder="https://" value={f.liveUrl} onChange={(v) => set("liveUrl", v)} />
          <TextField label="Demo note" hint="Shown when there is no public link." value={f.demoNote} onChange={(v) => set("demoNote", v)} />
        </div>
        <LinesField label="Stack" value={f.stack} onChange={(v) => set("stack", v)} rows={3} />
      </FormSection>

      <FormSection title="Images" description="Cover for cards; customer and owner views for the work slides and case study.">
        <ImageField label="Cover" value={f.cover} onChange={(v) => set("cover", v)} canUpload={canUpload} />
        <ImageField label="Customer view" value={f.customerView} onChange={(v) => set("customerView", v)} canUpload={canUpload} />
        <ImageField label="Owner view" value={f.ownerView} onChange={(v) => set("ownerView", v)} canUpload={canUpload} />
      </FormSection>

      <FormSection title="Three layers" description="What the build includes at each layer. Shown on the work slides and case study.">
        <div className="grid gap-4 md:grid-cols-3">
          <LinesField label="Website" value={f.layers.website} onChange={(v) => set("layers", { ...f.layers, website: v })} />
          <LinesField label="System" value={f.layers.system} onChange={(v) => set("layers", { ...f.layers, system: v })} />
          <LinesField label="Automation" value={f.layers.automation} onChange={(v) => set("layers", { ...f.layers, automation: v })} />
        </div>
        <RowsField
          label="Features"
          rows={f.features}
          onChange={(v) => set("features", v)}
          empty={{ title: "", text: "" }}
          columns={[
            { key: "title", label: "Feature" },
            { key: "text", label: "What it does (optional)" },
          ]}
        />
        <RowsField
          label="UI fragments"
          hint="Small live-looking notifications shown beside the project."
          max={6}
          rows={f.uiFragments}
          onChange={(v) => set("uiFragments", v)}
          empty={{ tag: "", text: "" }}
          columns={[
            { key: "tag", label: "Source" },
            { key: "text", label: "Message" },
          ]}
        />
        <RowsField
          label="Owner dashboard agents"
          hint="Used when there is no owner-view screenshot. Mark the ones that need the owner."
          max={12}
          rows={f.agents}
          onChange={(v) => set("agents", v)}
          empty={{ name: "", status: "", needsYou: false }}
          columns={[
            { key: "name", label: "Agent" },
            { key: "status", label: "Status" },
            { key: "needsYou", label: "Needs you", kind: "switch" },
          ]}
        />
      </FormSection>

      <FormSection title="Case study" description="Turn on the case study page and fill in what is true. Empty fields stay hidden.">
        <SwitchField label="Has a case study page" hint={f.slug ? `/work/${f.slug}` : undefined} checked={f.hasCaseStudy} onChange={(v) => set("hasCaseStudy", v)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Client" value={f.client} onChange={(v) => set("client", v)} />
          <TextField label="Your role" value={f.role} onChange={(v) => set("role", v)} />
          <TextField label="Timeline" placeholder="e.g. 6 weeks" value={f.timeline} onChange={(v) => set("timeline", v)} />
          <TextField label="Outcome" hint="One line with a real result." value={f.outcome} onChange={(v) => set("outcome", v)} />
        </div>
        <TextAreaField label="The problem" rows={4} value={f.problem} onChange={(v) => set("problem", v)} />
        <RowsField
          label="Key decisions"
          max={12}
          rows={f.decisions}
          onChange={(v) => set("decisions", v)}
          empty={{ title: "", text: "" }}
          columns={[
            { key: "title", label: "Decision" },
            { key: "text", label: "Why", kind: "textarea" },
          ]}
        />
        <RowsField
          label="Results"
          hint="Only real figures."
          max={8}
          rows={f.results}
          onChange={(v) => set("results", v)}
          empty={{ label: "", value: "" }}
          columns={[
            { key: "value", label: "Figure", placeholder: "e.g. 10 min" },
            { key: "label", label: "Label", placeholder: "e.g. daily order checks" },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="Video URL"
            hint="mp4 or webm."
            value={f.video?.src}
            onChange={(v) => set("video", v ? { ...f.video, src: v } : undefined)}
          />
          <TextField
            label="Video poster"
            value={f.video?.poster}
            disabled={!f.video?.src}
            onChange={(v) => f.video && set("video", { ...f.video, poster: v })}
          />
          <TextField
            label="Video caption"
            value={f.video?.caption}
            disabled={!f.video?.src}
            onChange={(v) => f.video && set("video", { ...f.video, caption: v })}
          />
        </div>
      </FormSection>

      <FormSection title="Visibility">
        <SwitchField label="Published" hint="Drafts never show on the site." checked={f.published} onChange={(v) => set("published", v)} />
        <SwitchField label="Featured" hint="Large slide in Selected work instead of the archive." checked={f.featured} onChange={(v) => set("featured", v)} />
      </FormSection>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-paper-edge/70 bg-paper-hi/95 backdrop-blur lg:left-[232px]">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <span aria-hidden="true" className={dirty ? "size-2 rounded-full bg-copper" : "size-2 rounded-full bg-[#5d7a4a]"} />
            <span role="status">{dirty ? "Unsaved changes" : "All changes saved"}</span>
            {id && f.published && f.hasCaseStudy && (
              <Link href={`/work/${f.slug}`} target="_blank" className="ml-2 inline-flex items-center gap-1 underline underline-offset-4">
                View <ExternalLink className="size-3" />
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            {id && (
              <ConfirmButton
                title={`Delete ${f.title || "this project"}?`}
                description="It disappears from the site straight away. This can't be undone."
                confirmLabel="Delete project"
                onConfirm={async () => {
                  const res = await deleteProject(id);
                  if (!res.ok) return void toast.error(res.error);
                  toast.success("Project deleted");
                  router.replace("/admin/projects");
                }}
              >
                <Trash2 /> Delete
              </ConfirmButton>
            )}
            <Button type="submit" size="lg" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {id ? "Save changes" : "Create project"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
