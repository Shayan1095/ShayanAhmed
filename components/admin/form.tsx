"use client";

/* eslint-disable react-hooks/refs --
   React Hook Form's useController returns `field.ref` as a callback ref (it
   registers the input so errors can focus it). Passing it to an element is the
   documented pattern; nothing reads a ref's `.current` during render. */

import { useEffect } from "react";
import { useController, useFormContext, type FieldPath, type FieldValues } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ImageRef } from "@/lib/content/types";
import {
  errorProps,
  FieldError,
  ImageField,
  LinesField,
  RowsField,
  SwitchField,
  TextAreaField,
  TextField,
  type RowColumn,
} from "./fields";

/**
 * React Hook Form bindings for the admin fields. Each one reads its value and
 * error from the surrounding <FormProvider>, so forms stay declarative:
 * <FormText name="title" label="Title" />. Validation comes from the same
 * zod schemas the server uses (lib/admin/schemas.ts).
 */

type Named<T extends FieldValues> = { name: FieldPath<T> };

export function FormText<T extends FieldValues>({
  name,
  ...props
}: Named<T> & Omit<React.ComponentProps<typeof TextField>, "value" | "onChange" | "error" | "name">) {
  const { field, fieldState } = useController<T>({ name });
  return (
    <TextField
      {...props}
      name={field.name}
      ref={field.ref}
      value={field.value as string | undefined}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  );
}

export function FormTextArea<T extends FieldValues>({
  name,
  ...props
}: Named<T> & Omit<React.ComponentProps<typeof TextAreaField>, "value" | "onChange" | "error" | "name">) {
  const { field, fieldState } = useController<T>({ name });
  return (
    <TextAreaField
      {...props}
      name={field.name}
      ref={field.ref}
      value={field.value as string | undefined}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  );
}

export function FormLines<T extends FieldValues>({
  name,
  ...props
}: Named<T> & Omit<React.ComponentProps<typeof LinesField>, "value" | "onChange" | "error" | "onBlur">) {
  const { field, fieldState } = useController<T>({ name });
  const itemError = Array.isArray(fieldState.error)
    ? fieldState.error.find((e) => e?.message)?.message
    : fieldState.error?.message;
  return (
    <LinesField
      {...props}
      value={(field.value as string[]) ?? []}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={itemError}
    />
  );
}

export function FormSwitch<T extends FieldValues>({
  name,
  ...props
}: Named<T> & Omit<React.ComponentProps<typeof SwitchField>, "checked" | "onChange">) {
  const { field } = useController<T>({ name });
  return <SwitchField {...props} checked={Boolean(field.value)} onChange={field.onChange} />;
}

export function FormRows<T extends FieldValues, R extends Record<string, unknown>>({
  name,
  ...props
}: Named<T> & { label: string; hint?: string; columns: RowColumn<R>[]; empty: R; max?: number }) {
  const { field, fieldState } = useController<T>({ name });
  return (
    <RowsField<R>
      {...props}
      rows={(field.value as R[]) ?? []}
      onChange={field.onChange}
      rowErrors={fieldState.error}
    />
  );
}

export function FormImage<T extends FieldValues>({
  name,
  ...props
}: Named<T> & { label: string; hint?: string; canUpload: boolean }) {
  const { field, fieldState } = useController<T>({ name });
  const err = fieldState.error as unknown as Record<string, { message?: string }> | undefined;
  const message = err && (Object.values(err).find((e) => e?.message)?.message ?? (err as { message?: string }).message);
  return (
    <div>
      <ImageField {...props} value={field.value as ImageRef | undefined} onChange={field.onChange} />
      <FieldError id={`${field.name}-error`} error={message} />
    </div>
  );
}

export function FormSelect<T extends FieldValues>({
  name,
  label,
  options,
}: Named<T> & { label: string; options: { value: string; label: string }[] }) {
  const { field, fieldState } = useController<T>({ name });
  const id = `select-${field.name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-label`} className="text-[13px] font-semibold">
        {label}
      </span>
      <Select value={field.value as string} onValueChange={field.onChange}>
        <SelectTrigger
          ref={field.ref}
          aria-labelledby={`${id}-label`}
          onBlur={field.onBlur}
          className="h-9 w-full bg-paper"
          {...errorProps(id, fieldState.error?.message)}
        >
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
      <FieldError id={`${id}-error`} error={fieldState.error?.message} />
    </div>
  );
}

/** Warns before leaving the page with unsaved changes. */
export function useUnsavedChangesWarning() {
  const {
    formState: { isDirty },
  } = useFormContext();
  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);
}

/** Maps a server action error ("field: message") onto the matching field, or returns it for a toast. */
export function serverErrorToField(error: string): { field?: string; message: string } {
  const m = /^([a-zA-Z0-9_.]+): (.+)$/.exec(error);
  if (m) return { field: m[1], message: m[2] };
  if (error === "That value is already in use.") return { field: "slug", message: "Another project already uses this slug." };
  return { message: error };
}
