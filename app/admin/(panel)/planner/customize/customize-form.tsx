"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FormSection } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { swatches } from "@/lib/admin/colors";
import type { PlannerConfig } from "@/lib/admin/types";
import { savePlannerConfig } from "../actions";

type Item = { id: string; name: string; color: string; done?: boolean };

const newId = (name: string) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "item"}-${Math.random().toString(36).slice(2, 6)}`;

function ColorPicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Colour for ${label}`}
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border border-paper-edge/70 bg-paper hover:border-paper-edge"
      >
        <span className="size-4 rounded-full" style={{ background: value }} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="grid grid-cols-4 gap-1 p-2">
        {swatches.map((s) => (
          <DropdownMenuItem
            key={s.value}
            onSelect={() => onChange(s.value)}
            aria-label={s.name}
            className="grid size-8 place-items-center p-0"
          >
            <span className="grid size-5 place-items-center rounded-full" style={{ background: s.value }}>
              {s.value === value && <Check className="size-3 text-white" />}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ItemsEditor({
  items,
  onChange,
  noun,
  withDone,
  max,
}: {
  items: Item[];
  onChange: (v: Item[]) => void;
  noun: string;
  withDone?: boolean;
  max: number;
}) {
  const update = (i: number, p: Partial<Item>) => onChange(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...items];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col gap-2">
        {items.map((it, i) => (
          <li key={it.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-paper-edge/60 bg-paper p-2">
            <ColorPicker value={it.color} onChange={(c) => update(i, { color: c })} label={it.name || noun} />
            <Input
              aria-label={`${noun} name`}
              value={it.name}
              onChange={(e) => update(i, { name: e.target.value })}
              className="h-8 min-w-0 flex-1 bg-paper-hi"
            />
            {withDone && (
              <label className="flex items-center gap-2 px-1 text-[12.5px] text-muted">
                <Switch checked={Boolean(it.done)} onCheckedChange={(v) => update(i, { done: v })} />
                Counts as done
              </label>
            )}
            <div className="flex items-center gap-0.5">
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${it.name || noun}`}
                onClick={() => onChange(items.filter((_, j) => j !== i))}
              >
                <Trash2 />
              </Button>
            </div>
          </li>
        ))}
      </ol>
      {items.length < max && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() =>
            onChange([
              ...items,
              { id: newId(noun), name: "", color: swatches[items.length % swatches.length].value, ...(withDone ? { done: false } : {}) },
            ])
          }
        >
          <Plus /> Add {noun.toLowerCase()}
        </Button>
      )}
    </div>
  );
}

/** Make the planner fit how you work: columns, lists, tags and the weekly goal. */
export function CustomizeForm({ initial }: { initial: PlannerConfig }) {
  const [cfg, setCfg] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const set = (p: Partial<PlannerConfig>) => {
    setCfg((c) => ({ ...c, ...p }));
    setDirty(true);
  };

  const removedCols = initial.columns.filter((c) => !cfg.columns.some((n) => n.id === c.id));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await savePlannerConfig({
            ...cfg,
            columns: cfg.columns.map((c) => ({ ...c, name: c.name.trim(), done: Boolean(c.done) })),
          });
          if (!res.ok) return void toast.error(res.error);
          setDirty(false);
          toast.success("Planner updated");
        });
      }}
      className="flex flex-col gap-5"
    >
      <FormSection
        title="Board columns"
        description="The stages a task moves through, left to right. Tasks entering a column marked done count toward your progress."
      >
        <ItemsEditor
          items={cfg.columns}
          onChange={(v) => set({ columns: v.map((c) => ({ ...c, done: Boolean(c.done) })) })}
          noun="Column"
          withDone
          max={10}
        />
        {removedCols.length > 0 && (
          <p role="status" className="text-[12.5px] text-[#8a521a]">
            Tasks in {removedCols.map((c) => c.name).join(", ")} will move to the first open column when you save.
          </p>
        )}
      </FormSection>

      <FormSection title="Lists" description="The areas of your work, such as Portfolio, Clients and Learning. Each task belongs to one list.">
        <ItemsEditor items={cfg.lists} onChange={(v) => set({ lists: v })} noun="List" max={20} />
      </FormSection>

      <FormSection title="Tags" description="Labels that cut across lists, such as Content or Outreach. A task can have several.">
        <ItemsEditor items={cfg.tags} onChange={(v) => set({ tags: v })} noun="Tag" max={30} />
      </FormSection>

      <FormSection title="Weekly goal" description="How many tasks you aim to finish each week. Shown as the ring and the dashed line in Progress.">
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={1}
            max={200}
            aria-label="Weekly goal"
            value={cfg.weeklyGoal}
            onChange={(e) => set({ weeklyGoal: Math.max(1, Math.min(200, Number(e.target.value) || 1)) })}
            className="h-9 w-24 bg-paper"
          />
          <span className="text-[14px] text-muted">tasks per week</span>
        </div>
      </FormSection>

      <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-xl border border-paper-edge/70 bg-paper-hi/95 p-3 backdrop-blur">
        <span role="status" className="text-[13px] text-muted">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>
        <Button type="submit" size="lg" disabled={pending || !dirty}>
          {pending && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </div>
    </form>
  );
}
