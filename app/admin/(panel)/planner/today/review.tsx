"use client";

import { useState, useTransition } from "react";
import { BatteryFull, BatteryLow, BatteryMedium, Moon, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DayStat } from "@/lib/admin/ritual";
import type { PlannerDay } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { saveReview } from "./actions";

const energy = [
  { n: 1, label: "Drained" },
  { n: 2, label: "Low" },
  { n: 3, label: "Okay" },
  { n: 4, label: "Good" },
  { n: 5, label: "Sharp" },
];

/** Evening review: one win, one thing to do better, energy. Closing the day is worth points too. */
export function Review({ today, day, stat, goalMet, onDay }: { today: string; day: PlannerDay; stat: DayStat; goalMet: boolean; onDay: (d: PlannerDay) => void }) {
  const [editing, setEditing] = useState(!day.reviewedAt);
  const [win, setWin] = useState(day.review.win);
  const [improve, setImprove] = useState(day.review.improve);
  const [level, setLevel] = useState(day.review.energy);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const submit = () => {
    if (!level) return setError("Rate your energy first");
    start(async () => {
      const res = await saveReview(today, { win, improve, energy: level });
      if (!res.ok || !res.data) return void toast.error(res.ok ? "Couldn't save" : res.error);
      onDay(res.data);
      setEditing(false);
      toast.success(day.reviewedAt ? "Review updated" : "+10 · Day closed", { description: goalMet ? "Goal hit and reviewed. Rest well." : "Tomorrow is a fresh start." });
    });
  };

  if (!editing && day.reviewedAt)
    return (
      <div className="flex flex-1 flex-col gap-3">
        <div className="screen flex items-center gap-3 px-4 py-3">
          <Moon className="relative z-[1] size-5 text-[var(--screen-amber)]" aria-hidden="true" />
          <p className="relative z-[1] font-mono text-[11.5px] uppercase tracking-[0.1em] text-[var(--screen-amber)]">
            Day closed · {stat.done} done · {stat.focus} min focus · {stat.points} pts
          </p>
        </div>
        {day.review.win && <Line label="Win" text={day.review.win} />}
        {day.review.improve && <Line label="Better tomorrow" text={day.review.improve} />}
        <p className="text-[12.5px] text-muted">Energy: {energy.find((e) => e.n === day.review.energy)?.label}</p>
        <button type="button" onClick={() => setEditing(true)} className="mt-auto inline-flex w-fit cursor-pointer items-center gap-1.5 text-[12.5px] font-semibold text-muted hover:text-ink">
          <Pencil className="size-3.5" aria-hidden="true" /> Edit review
        </button>
      </div>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-3"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold">Today&apos;s win</span>
        <Textarea rows={2} value={win} maxLength={500} onChange={(e) => setWin(e.target.value)} placeholder="What went well, however small?" className="min-h-14 bg-paper" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold">Better tomorrow</span>
        <Textarea rows={2} value={improve} maxLength={500} onChange={(e) => setImprove(e.target.value)} placeholder="One thing to do differently" className="min-h-14 bg-paper" />
      </label>
      <fieldset>
        <legend className="mb-1.5 text-[13px] font-semibold">Energy</legend>
        <div role="radiogroup" aria-label="Energy" className="grid grid-cols-5 gap-1.5">
          {energy.map((e) => {
            const Icon = e.n <= 2 ? BatteryLow : e.n === 3 ? BatteryMedium : BatteryFull;
            return (
              <button
                key={e.n}
                type="button"
                role="radio"
                aria-checked={level === e.n}
                onClick={() => (setLevel(e.n), setError(""))}
                className={cn("flex cursor-pointer flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-transform active:translate-y-px", level === e.n ? "lit text-[#1a1208]" : "keycap text-muted")}
              >
                <Icon className="size-4" aria-hidden="true" />
                {e.label}
              </button>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-alert">
            {error}
          </p>
        )}
      </fieldset>
      <Button type="submit" size="lg" disabled={pending}>
        <Moon /> {day.reviewedAt ? "Update review" : "Close the day"}
      </Button>
    </form>
  );
}

function Line({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="engraved font-mono text-[10px] uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-[14px] leading-snug">{text}</p>
    </div>
  );
}
