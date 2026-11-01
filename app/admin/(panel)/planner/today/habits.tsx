"use client";

import { useState, useTransition } from "react";
import { Check, Flame, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDays } from "@/lib/admin/dates";
import { habitStreak } from "@/lib/admin/ritual";
import type { PlannerDay, PlannerHabit } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { saveHabits, toggleHabit } from "./actions";

const palette = ["#c9853f", "#5d7a4a", "#7a4f78", "#3f6f8f", "#b4525a", "#b8901c", "#6b4a2f", "#8a8172"];

/** Daily habits: tap to check today, see the last 7 days and each habit's streak. Editable in place. */
export function Habits({
  today,
  day,
  days,
  habits,
  onDay,
  onHabits,
}: {
  today: string;
  day: PlannerDay;
  days: PlannerDay[];
  habits: PlannerHabit[];
  onDay: (d: PlannerDay) => void;
  onHabits: (h: PlannerHabit[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(habits);
  const [pending, start] = useTransition();
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const byDate = new Map(days.map((d) => [d.date, d]));

  const toggle = (h: PlannerHabit) => {
    const on = !day.habits.includes(h.id);
    onDay({ ...day, habits: on ? [...day.habits, h.id] : day.habits.filter((x) => x !== h.id) });
    if (on) toast.success(`+5 · ${h.name}`);
    start(async () => {
      const res = await toggleHabit(today, h.id, on);
      if (!res.ok || !res.data) return void toast.error(res.ok ? "Couldn't save" : res.error);
      onDay(res.data);
    });
  };

  const save = () =>
    start(async () => {
      const clean = draft.map((h) => ({ ...h, name: h.name.trim() })).filter((h) => h.name);
      const res = await saveHabits(clean);
      if (!res.ok) return void toast.error(res.error);
      onHabits(clean);
      setEditing(false);
      toast.success("Habits saved");
    });

  if (editing)
    return (
      <div className="flex flex-col gap-2">
        {draft.map((h, i) => (
          <div key={h.id} className="flex items-center gap-2">
            <button
              type="button"
              aria-label={`Change colour of ${h.name || "habit"}`}
              onClick={() => setDraft((d) => d.map((x, j) => (j === i ? { ...x, color: palette[(palette.indexOf(x.color) + 1) % palette.length] } : x)))}
              className="size-6 shrink-0 cursor-pointer rounded-full ring-2 ring-white/60"
              style={{ background: h.color }}
            />
            <Input
              aria-label="Habit name"
              value={h.name}
              maxLength={40}
              onChange={(e) => setDraft((d) => d.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              className="h-9 bg-paper"
            />
            <button
              type="button"
              aria-label={`Remove ${h.name || "habit"}`}
              onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-muted hover:bg-paper-lo hover:text-alert"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        {draft.length < 8 && (
          <button
            type="button"
            onClick={() => setDraft((d) => [...d, { id: `h${Date.now().toString(36)}`, name: "", color: palette[d.length % palette.length] }])}
            className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-muted hover:text-ink"
          >
            <Plus className="size-4" /> Add a habit
          </button>
        )}
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="outline" onClick={() => (setDraft(habits), setEditing(false))}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            Save habits
          </Button>
        </div>
      </div>
    );

  if (habits.length === 0)
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-[13.5px] text-muted">Add the small daily actions that keep you on track.</p>
        <Button onClick={() => (setDraft([{ id: "h1", name: "", color: palette[0] }]), setEditing(true))}>
          <Plus /> Add habits
        </Button>
      </div>
    );

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div aria-hidden="true" className="mb-1 grid grid-cols-[1fr_repeat(7,14px)_44px] items-center gap-1.5 px-1">
        <span />
        {week.map((d) => (
          <span key={d} className={cn("text-center font-mono text-[9px] uppercase", d === today ? "text-copper-ink" : "text-muted")}>
            {new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { weekday: "narrow" })}
          </span>
        ))}
        <span />
      </div>
      <ul className="flex flex-col gap-2">
        {habits.map((h) => {
          const done = day.habits.includes(h.id);
          const streak = habitStreak(days, h.id, today);
          return (
            <li key={h.id} className="grid grid-cols-[1fr_repeat(7,14px)_44px] items-center gap-1.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={done}
                onClick={() => toggle(h)}
                className={cn("flex min-w-0 cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-transform active:translate-y-px", done ? "groove !rounded-xl" : "keycap")}
              >
                <span
                  className="grid size-6 shrink-0 place-items-center rounded-md"
                  style={done ? { background: h.color, boxShadow: `0 0 10px ${h.color}` } : { boxShadow: `inset 0 0 0 2px ${h.color}` }}
                >
                  {done && <Check className="size-4 text-white" strokeWidth={3} />}
                </span>
                <span className={cn("truncate text-[13.5px] font-semibold", done && "text-muted")}>{h.name}</span>
              </button>
              {week.map((d) => {
                const on = d === today ? done : Boolean(byDate.get(d)?.habits.includes(h.id));
                return (
                  <span
                    key={d}
                    title={`${d}: ${on ? "done" : "missed"}`}
                    className={cn("size-3.5 rounded-[4px]", !on && "groove !rounded-[4px]", d === today && "ring-1 ring-copper/60 ring-offset-1 ring-offset-transparent")}
                    style={on ? { background: h.color, boxShadow: `0 0 6px ${h.color}` } : undefined}
                  />
                );
              })}
              <span className={cn("flex items-center justify-end gap-0.5 font-mono text-[11px] font-semibold", streak ? "text-copper-ink" : "text-muted")}>
                <Flame className="size-3.5" aria-hidden="true" />
                {streak}
                <span className="sr-only"> day streak</span>
              </span>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => (setDraft(habits), setEditing(true))}
        className="mt-auto inline-flex w-fit cursor-pointer items-center gap-1.5 pt-2 text-[12.5px] font-semibold text-muted hover:text-ink"
      >
        <Pencil className="size-3.5" aria-hidden="true" /> Edit habits
      </button>
    </div>
  );
}
