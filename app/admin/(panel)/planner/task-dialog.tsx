"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addDays, dayKey, dueKey } from "@/lib/admin/dates";
import type { PlannerConfig, Priority, Task } from "@/lib/admin/types";
import { priorityMeta } from "./task-card";

const NONE = "__none";

/**
 * Task details. Changes save as you go: toggles and selects at once, text
 * after a short pause, so closing the dialog never loses anything.
 */
export function TaskDialog({
  task,
  config,
  onClose,
  onChange,
  onDelete,
}: {
  task: Task | null;
  config: PlannerConfig;
  onClose: () => void;
  onChange: (id: string, patch: Partial<Task>, immediate?: boolean) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [newItem, setNewItem] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  // Load the opened task's text into the editable fields.
  const [shownId, setShownId] = useState(task?.id);
  if (task && task.id !== shownId) {
    setShownId(task.id);
    setTitle(task.title);
    setNotes(task.notes);
    setNewItem("");
  }

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  if (!task) return <Dialog open={false} />;

  const textPatch = (patch: Partial<Task>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(task.id, patch, true), 600);
    onChange(task.id, patch, false);
  };
  const flush = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
      if (title.trim()) onChange(task.id, { title: title.trim(), notes }, true);
    }
  };
  const addItem = () => {
    const text = newItem.trim();
    if (!text) return;
    onChange(task.id, { checklist: [...task.checklist, { id: crypto.randomUUID().slice(0, 8), text, done: false }] }, true);
    setNewItem("");
  };

  const checked = task.checklist.filter((c) => c.done).length;

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) {
          flush();
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto bg-paper-hi p-0 sm:max-w-[640px]">
        <div className="border-b border-paper-edge/60 p-5 pb-4">
          <DialogTitle className="sr-only">Task details</DialogTitle>
          <DialogDescription className="sr-only">Edit the task. Changes save automatically.</DialogDescription>
          <Input
            aria-label="Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.trim()) textPatch({ title: e.target.value.trim() });
            }}
            className="h-auto border-0 bg-transparent px-0 font-display text-[20px] font-extrabold shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <Meta label="Column">
            <Select value={task.columnId} onValueChange={(v) => onChange(task.id, { columnId: v }, true)}>
              <SelectTrigger aria-label="Column" className="h-9 w-full bg-paper">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.columns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span aria-hidden="true" className="size-2 rounded-full" style={{ background: c.color }} />
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Meta>
          <Meta label="Priority">
            <Select value={task.priority} onValueChange={(v) => onChange(task.id, { priority: v as Priority }, true)}>
              <SelectTrigger aria-label="Priority" className="h-9 w-full bg-paper">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(priorityMeta) as Priority[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    <span aria-hidden="true" className="size-2 rounded-full" style={{ background: priorityMeta[p].color }} />
                    {priorityMeta[p].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Meta>
          <Meta label="List">
            <Select value={task.listId || NONE} onValueChange={(v) => onChange(task.id, { listId: v === NONE ? "" : v }, true)}>
              <SelectTrigger aria-label="List" className="h-9 w-full bg-paper">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No list</SelectItem>
                {config.lists.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    <span aria-hidden="true" className="size-2 rounded-full" style={{ background: l.color }} />
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Meta>
          <Meta label="Due date">
            <div className="flex gap-1.5">
              <Input
                type="date"
                aria-label="Due date"
                value={dueKey(task.due) ?? ""}
                onChange={(e) => onChange(task.id, { due: e.target.value || null }, true)}
                className="h-9 bg-paper"
              />
              {task.due && (
                <Button variant="ghost" size="icon" aria-label="Clear due date" onClick={() => onChange(task.id, { due: null }, true)}>
                  <X />
                </Button>
              )}
            </div>
            <div className="flex gap-1">
              {(
                [
                  ["Today", 0],
                  ["Tomorrow", 1],
                  ["Next week", 7],
                ] as const
              ).map(([label, n]) => (
                <Button
                  key={label}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => onChange(task.id, { due: addDays(dayKey(), n) }, true)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </Meta>
          {config.tags.length > 0 && (
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-[12px] font-medium text-muted">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {config.tags.map((t) => {
                  const on = task.tags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        onChange(task.id, { tags: on ? task.tags.filter((x) => x !== t.id) : [...task.tags, t.id] }, true)
                      }
                      className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border px-2 text-[12.5px] font-medium transition-colors"
                      style={
                        on
                          ? { background: `${t.color}22`, color: t.color, borderColor: `${t.color}66` }
                          : { borderColor: "var(--color-paper-edge)", color: "var(--color-muted)" }
                      }
                    >
                      {on && <Check className="size-3" aria-hidden="true" />}
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-5">
          <label htmlFor="task-notes" className="mb-1.5 block text-[12px] font-medium text-muted">
            Notes
          </label>
          <Textarea
            id="task-notes"
            rows={4}
            value={notes}
            placeholder="Context, links, next step…"
            onChange={(e) => {
              setNotes(e.target.value);
              textPatch({ notes: e.target.value });
            }}
            className="bg-paper"
          />
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-medium text-muted">Checklist</p>
            {task.checklist.length > 0 && (
              <p className="font-mono text-[11.5px] text-muted">
                {checked}/{task.checklist.length}
              </p>
            )}
          </div>
          {task.checklist.length > 0 && (
            <div aria-hidden="true" className="mb-3 h-1 overflow-hidden rounded-full bg-paper-edge/50">
              <div className="h-full rounded-full bg-[#5d7a4a] transition-[width]" style={{ width: `${(checked / task.checklist.length) * 100}%` }} />
            </div>
          )}
          <ul className="flex flex-col gap-1">
            {task.checklist.map((item) => (
              <li key={item.id} className="group/item flex items-center gap-2.5 rounded-md px-1 py-1 hover:bg-paper-edge/25">
                <Checkbox
                  id={`chk-${item.id}`}
                  checked={item.done}
                  onCheckedChange={(v) =>
                    onChange(task.id, { checklist: task.checklist.map((c) => (c.id === item.id ? { ...c, done: v === true } : c)) }, true)
                  }
                />
                <label htmlFor={`chk-${item.id}`} className={`flex-1 text-[14px] ${item.done ? "text-muted line-through" : ""}`}>
                  {item.text}
                </label>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Remove ${item.text}`}
                  className="opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100"
                  onClick={() => onChange(task.id, { checklist: task.checklist.filter((c) => c.id !== item.id) }, true)}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addItem();
            }}
          >
            <Input aria-label="New checklist item" placeholder="Add a step" value={newItem} onChange={(e) => setNewItem(e.target.value)} className="h-8 bg-paper" />
            <Button type="submit" variant="outline" size="sm" disabled={!newItem.trim()}>
              <Plus /> Add
            </Button>
          </form>
        </div>

        <div className="flex items-center justify-between border-t border-paper-edge/60 px-5 py-3">
          <p className="text-[12px] text-muted">
            Created {new Date(task.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            {task.completedAt &&
              ` · Done ${new Date(task.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
          </p>
          <ConfirmButton
            size="sm"
            title="Delete this task?"
            description="It is removed from the planner and from your progress. This can't be undone."
            confirmLabel="Delete task"
            onConfirm={() => onDelete(task.id)}
          >
            <Trash2 /> Delete
          </ConfirmButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-muted">{label}</span>
      {children}
    </div>
  );
}
