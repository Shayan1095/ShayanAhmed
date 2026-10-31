"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ImageUp, Loader2, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/components/admin/upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ImageRef } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { setProjectImage } from "../../content-actions";

type Slot = "cover" | "customerView" | "ownerView";
type Row = { id: string; title: string; kind: string; published: boolean } & Partial<Record<Slot, ImageRef>>;

/** Each slot says where the image appears, so you know what to upload. */
const slots: { key: Slot; label: string; where: string }[] = [
  { key: "customerView", label: "Customer view", where: "Work slides, case study, hero and social previews" },
  { key: "ownerView", label: "Owner view", where: "Owner side of the work slide and case study" },
  { key: "cover", label: "Cover", where: "Archive card (falls back for the customer view)" },
];

export function ScreenshotsBoard({ projects }: { projects: Row[] }) {
  const [rows, setRows] = useState(projects);

  const apply = async (id: string, slot: Slot, image: ImageRef | null) => {
    const res = await setProjectImage(id, slot, image);
    if (!res.ok) throw new Error(res.error);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [slot]: image ?? undefined } : r)));
  };

  if (rows.length === 0) return <p className="text-muted">No projects yet.</p>;

  return (
    <div className="flex flex-col gap-4">
      {rows.map((p) => {
        const filled = slots.filter((s) => p[s.key]).length;
        return (
          <section key={p.id} aria-labelledby={`shots-${p.id}`} className="surface rounded-2xl p-4 sm:p-5">
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id={`shots-${p.id}`} className="font-display text-[17px] font-extrabold">
                  {p.title}
                </h2>
                <p className="text-[13px] text-muted">{p.kind}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={filled === slots.length ? "default" : "outline"}>
                  {filled}/{slots.length} images
                </Badge>
                {!p.published && <Badge variant="outline">Draft</Badge>}
                <Link
                  href={`/admin/projects/${p.id}`}
                  className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[13px] text-muted hover:bg-paper-edge/35 hover:text-ink"
                >
                  <Pencil className="size-3.5" aria-hidden="true" /> Edit project
                </Link>
              </div>
            </header>
            <div className="grid gap-3 md:grid-cols-3">
              {slots.map((s) => (
                <SlotTile key={s.key} project={p.title} slot={s} image={p[s.key]} onSet={(img) => apply(p.id, s.key, img)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SlotTile({
  project,
  slot,
  image,
  onSet,
}: {
  project: string;
  slot: { key: Slot; label: string; where: string };
  image?: ImageRef;
  onSet: (img: ImageRef | null) => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [alt, setAlt] = useState(image?.alt ?? "");

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const upload = (file: File) =>
    run(async () => {
      const img = await uploadFile(file);
      const nextAlt = alt || `${project} ${slot.label.toLowerCase()}`;
      setAlt(nextAlt);
      await onSet({ ...img, alt: nextAlt });
    }, `${slot.label} updated`);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[13px] font-semibold">{slot.label}</p>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) upload(f);
        }}
        aria-label={`${image ? "Replace" : "Upload"} ${slot.label.toLowerCase()} for ${project}`}
        className={cn(
          "group relative grid aspect-[16/10] w-full cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-paper-edge bg-paper transition-colors",
          "hover:border-ink/40 focus-visible:outline-2 focus-visible:outline-copper",
          over && "border-copper bg-copper/12",
          image && "border-solid",
        )}
      >
        {image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
            <img src={image.src} alt="" className="absolute inset-0 size-full object-cover object-top" />
            <span className="absolute inset-0 grid place-items-center bg-ink/55 text-[13px] font-semibold text-paper opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="size-4" aria-hidden="true" /> Replace
              </span>
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-1.5 px-4 text-center text-[13px] text-muted">
            <ImageUp className="size-5" aria-hidden="true" />
            Drop a screenshot or click to upload
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-paper/70">
            <Loader2 className="size-5 animate-spin" aria-label="Uploading" />
          </span>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <p className="text-[12px] leading-snug text-muted">{slot.where}</p>
      {image && (
        <div className="flex items-center gap-1.5">
          <Input
            aria-label={`Alt text for ${slot.label.toLowerCase()}`}
            placeholder="What the image shows"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            onBlur={() => alt !== image.alt && run(() => onSet({ ...image, alt }), "Alt text saved")}
            className="h-8 bg-paper"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${slot.label.toLowerCase()}`}
            disabled={busy}
            onClick={() => run(() => onSet(null), `${slot.label} removed`)}
          >
            <Trash2 />
          </Button>
        </div>
      )}
      {image && (
        <p className="font-mono text-[11px] text-muted">
          {image.width}×{image.height}
        </p>
      )}
    </div>
  );
}
