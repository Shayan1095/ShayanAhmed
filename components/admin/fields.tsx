"use client";

import { useId, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ImageRef } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { uploadFile } from "./upload";

/* Small, consistent field set for the admin. Every field has a visible label and optional hint. */

/** Inline validation message, linked to its control with aria-describedby. */
export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="text-[12.5px] font-medium leading-snug text-destructive">
      {error}
    </p>
  );
}

/** aria props for a control that may have an error. */
export const errorProps = (id: string, error?: string) =>
  error ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {};

function Shell({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </label>
      {children}
      <FieldError id={`${id}-error`} error={error} />
      {hint && !error && <p className="text-[12.5px] leading-snug text-muted">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  value,
  onChange,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange"> & {
  label: string;
  hint?: string;
  error?: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <Shell id={id} label={label} hint={hint} error={error} className={className}>
      <Input
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 bg-paper"
        {...errorProps(id, error)}
        {...props}
      />
    </Shell>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  value,
  onChange,
  rows = 3,
  className,
  ...props
}: Omit<React.ComponentProps<"textarea">, "value" | "onChange"> & {
  label: string;
  hint?: string;
  error?: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <Shell id={id} label={label} hint={hint} error={error} className={className}>
      <Textarea
        id={id}
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="bg-paper"
        {...errorProps(id, error)}
        {...props}
      />
    </Shell>
  );
}

/** A string list edited as one item per line. */
export function LinesField({
  label,
  hint,
  error,
  value,
  onChange,
  onBlur,
  rows = 4,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  onBlur?: () => void;
  value: string[];
  onChange: (v: string[]) => void;
  rows?: number;
  className?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value.join("\n"));
  return (
    <Shell id={id} label={label} hint={hint ?? "One per line."} error={error} className={className}>
      <Textarea
        id={id}
        rows={rows}
        value={draft}
        onBlur={onBlur}
        {...errorProps(id, error)}
        onChange={(e) => {
          setDraft(e.target.value);
          onChange(
            e.target.value
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          );
        }}
        className="bg-paper"
      />
    </Shell>
  );
}

export function SwitchField({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-paper-edge/60 bg-paper px-3.5 py-3">
      <div>
        <label htmlFor={id} className="text-[13.5px] font-semibold">
          {label}
        </label>
        {hint && <p className="text-[12.5px] leading-snug text-muted">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

/** Column definition for RowsField. */
export type RowColumn<T> = {
  key: keyof T & string;
  label: string;
  kind?: "text" | "textarea" | "switch";
  placeholder?: string;
  width?: string;
};

/** Repeating rows of small objects (features, results, spec sheet...). Add, edit, reorder, remove. */
export function RowsField<T extends Record<string, unknown>>({
  label,
  hint,
  rows,
  onChange,
  columns,
  empty,
  max = 20,
  rowErrors,
}: {
  /** Per-row field errors, in React Hook Form's shape: rowErrors[i][key].message. */
  rowErrors?: unknown;
  label: string;
  hint?: string;
  rows: T[];
  onChange: (rows: T[]) => void;
  columns: RowColumn<T>[];
  empty: T;
  max?: number;
}) {
  const groupId = useId();
  const update = (i: number, patch: Partial<T>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...rows];
    const [r] = next.splice(i, 1);
    next.splice(i + d, 0, r);
    onChange(next);
  };
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-[13px] font-semibold">{label}</legend>
      {hint && <p className="-mt-1 mb-1 text-[12.5px] text-muted">{hint}</p>}
      {rows.length === 0 && <p className="text-[13px] text-muted">None yet.</p>}
      <ol className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <li key={i} className="flex items-start gap-2 rounded-lg border border-paper-edge/60 bg-paper p-2.5">
            <span className="mt-2 w-5 shrink-0 text-center font-mono text-[11px] text-muted">{i + 1}</span>
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
              {columns.map((c) => {
                const fid = `${groupId}-${i}-${c.key}`;
                const v = row[c.key];
                const cellError = (rowErrors as Record<number, Record<string, { message?: string }> | undefined> | undefined)?.[i]?.[c.key]?.message;
                return (
                  <div key={c.key} className={cn("flex flex-col gap-1", c.kind === "textarea" && "sm:col-span-full")}>
                    <label htmlFor={fid} className="text-[11.5px] font-medium text-muted">
                      {c.label}
                    </label>
                    {c.kind === "switch" ? (
                      <Switch
                        id={fid}
                        checked={Boolean(v)}
                        onCheckedChange={(x) => update(i, { [c.key]: x } as Partial<T>)}
                      />
                    ) : c.kind === "textarea" ? (
                      <Textarea
                        id={fid}
                        rows={2}
                        value={String(v ?? "")}
                        placeholder={c.placeholder}
                        onChange={(e) => update(i, { [c.key]: e.target.value } as Partial<T>)}
                        className="bg-paper-hi"
                        {...errorProps(fid, cellError)}
                      />
                    ) : (
                      <Input
                        id={fid}
                        value={String(v ?? "")}
                        placeholder={c.placeholder}
                        onChange={(e) => update(i, { [c.key]: e.target.value } as Partial<T>)}
                        className="h-8 bg-paper-hi"
                        {...errorProps(fid, cellError)}
                      />
                    )}
                    <FieldError id={`${fid}-error`} error={cellError} />
                  </div>
                );
              })}
            </div>
            <div className="flex shrink-0 flex-col gap-0.5">
              <Button type="button" variant="ghost" size="icon-xs" aria-label={`Move ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Move ${i + 1} down`}
                disabled={i === rows.length - 1}
                onClick={() => move(i, 1)}
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${i + 1}`}
                onClick={() => onChange(rows.filter((_, j) => j !== i))}
              >
                <Trash2 />
              </Button>
            </div>
          </li>
        ))}
      </ol>
      {rows.length < max && (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => onChange([...rows, { ...empty }])}>
          <Plus /> Add
        </Button>
      )}
    </fieldset>
  );
}

/** One image: upload a file, or paste a URL / public path with its size and alt text. */
export function ImageField({
  label,
  hint,
  value,
  onChange,
  canUpload,
}: {
  label: string;
  hint?: string;
  value: ImageRef | undefined | null;
  onChange: (v: ImageRef | undefined) => void;
  canUpload: boolean;
}) {
  const id = useId();
  const file = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const v = value ?? undefined;
  const set = (patch: Partial<ImageRef>) =>
    onChange({ src: "", alt: "", width: 1600, height: 1000, ...v, ...patch });

  const upload = (f: File) =>
    start(async () => {
      try {
        const img = await uploadFile(f);
        onChange({ ...img, alt: v?.alt ?? "" });
        toast.success("Image uploaded");
      } catch (err) {
        toast.error((err as Error).message);
      }
    });

  return (
    <fieldset className="flex flex-col gap-2 rounded-lg border border-paper-edge/60 bg-paper p-3">
      <legend className="px-1 text-[13px] font-semibold">{label}</legend>
      {hint && <p className="-mt-1 text-[12.5px] text-muted">{hint}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="grid aspect-[16/10] w-full shrink-0 place-items-center overflow-hidden rounded-md border border-paper-edge/60 bg-paper-hi sm:w-44">
          {v?.src ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of any URL
            <img src={v.src} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-muted" aria-hidden="true" />
          )}
        </div>
        <div className="grid flex-1 gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor={`${id}-src`} className="text-[11.5px] font-medium text-muted">
              Image URL or path (e.g. /work/slug/cover.png)
            </label>
            <Input id={`${id}-src`} value={v?.src ?? ""} onChange={(e) => set({ src: e.target.value })} className="h-8 bg-paper-hi" />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor={`${id}-alt`} className="text-[11.5px] font-medium text-muted">
              Alt text (what the image shows)
            </label>
            <Input id={`${id}-alt`} value={v?.alt ?? ""} onChange={(e) => set({ alt: e.target.value })} className="h-8 bg-paper-hi" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-w`} className="text-[11.5px] font-medium text-muted">
              Width (px)
            </label>
            <Input id={`${id}-w`} type="number" min={1} value={v?.width ?? ""} onChange={(e) => set({ width: Number(e.target.value) })} className="h-8 bg-paper-hi" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-h`} className="text-[11.5px] font-medium text-muted">
              Height (px)
            </label>
            <Input id={`${id}-h`} type="number" min={1} value={v?.height ?? ""} onChange={(e) => set({ height: Number(e.target.value) })} className="h-8 bg-paper-hi" />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {canUpload && (
          <>
            <input
              ref={file}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => file.current?.click()}>
              {pending ? <Loader2 className="animate-spin" /> : <Upload />} Upload
            </Button>
          </>
        )}
        {v && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)}>
            <Trash2 /> Remove
          </Button>
        )}
      </div>
    </fieldset>
  );
}

/** Groups related fields under a heading, with a one-line purpose. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-paper-edge/70 bg-paper-hi p-5 sm:p-6">
      <h2 className="font-display text-[17px] font-extrabold">{title}</h2>
      {description && <p className="mb-4 mt-0.5 text-[13.5px] text-muted">{description}</p>}
      <div className={cn("flex flex-col gap-4", !description && "mt-4")}>{children}</div>
    </section>
  );
}
