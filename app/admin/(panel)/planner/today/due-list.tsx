"use client";

import { CircleCheck } from "lucide-react";
import { dueLabel } from "@/lib/admin/dates";
import type { Task } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

/** Open tasks due today or overdue: tick them off without opening the board. */
export function DueList({ today, tasks, onToggle }: { today: string; tasks: Task[]; onToggle: (t: Task, done: boolean) => void }) {
  if (tasks.length === 0)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
        <CircleCheck className="size-6 text-good" aria-hidden="true" />
        <p className="text-[14px] font-semibold">Nothing due or overdue</p>
        <p className="max-w-[32ch] text-[12.5px] text-muted">Give tasks a due date on the board and they show up here on the day.</p>
      </div>
    );
  const sorted = [...tasks].sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""));
  return (
    <ul className="flex flex-col gap-1.5">
      {sorted.slice(0, 8).map((t) => {
        const due = dueLabel(t.due, today);
        return (
          <li key={t.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-paper-lo/50">
              <input type="checkbox" onChange={() => onToggle(t, true)} className="size-[18px] shrink-0 cursor-pointer accent-good-mark" />
              <span className="min-w-0 flex-1 truncate text-[14px]">{t.title}</span>
              {due && <span className={cn("shrink-0 text-[11.5px] font-semibold", due.tone === "overdue" ? "text-alert" : "text-copper-ink")}>{due.text}</span>}
            </label>
          </li>
        );
      })}
      {sorted.length > 8 && <li className="px-2.5 text-[12px] text-muted">+{sorted.length - 8} more on the board</li>}
    </ul>
  );
}
