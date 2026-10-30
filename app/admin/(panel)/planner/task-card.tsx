"use client";

import { CalendarDays, CheckSquare, Flag, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dueLabel } from "@/lib/admin/dates";
import type { PlannerConfig, Priority, Task } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

export const priorityMeta: Record<Priority, { label: string; color: string }> = {
  none: { label: "No priority", color: "#8a8172" },
  low: { label: "Low", color: "#3f6f8f" },
  medium: { label: "Medium", color: "#b8901c" },
  high: { label: "High", color: "#c9853f" },
  urgent: { label: "Urgent", color: "#b4525a" },
};

const toneClass = {
  overdue: "text-[#a2353f] font-semibold",
  today: "text-[#8a521a] font-semibold",
  soon: "text-ink/80",
  later: "text-muted",
};

/** A task on the board or in a list. Click to open; the menu moves it without dragging. */
export function TaskCard({
  task,
  config,
  done,
  onOpen,
  onMove,
  dragProps,
  compact,
}: {
  task: Task;
  config: PlannerConfig;
  done: boolean;
  onOpen: () => void;
  onMove: (columnId: string) => void;
  dragProps?: React.HTMLAttributes<HTMLDivElement> & { draggable?: boolean };
  compact?: boolean;
}) {
  const list = config.lists.find((l) => l.id === task.listId);
  const tags = task.tags.map((id) => config.tags.find((t) => t.id === id)).filter(Boolean);
  const due = done ? null : dueLabel(task.due);
  const checks = task.checklist.length;
  const checked = task.checklist.filter((c) => c.done).length;

  return (
    <div
      {...dragProps}
      className={cn(
        "group/card relative rounded-lg border border-paper-edge/70 bg-paper-hi p-3 transition-shadow hover:border-paper-edge hover:shadow-[0_2px_10px_-4px_rgb(17_17_17/.18)]",
        dragProps?.draggable && "cursor-grab active:cursor-grabbing",
        done && "opacity-70",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "min-w-0 flex-1 cursor-pointer text-left text-[14px] font-medium leading-snug after:absolute after:inset-0 after:content-['']",
            done && "line-through decoration-ink/30",
          )}
        >
          {task.title}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Move ${task.title}`}
            className="relative z-10 -mr-1 -mt-0.5 grid size-6 shrink-0 cursor-pointer place-items-center rounded text-muted opacity-60 hover:bg-paper-edge/40 hover:opacity-100 focus-visible:opacity-100 group-hover/card:opacity-100"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Move to</DropdownMenuLabel>
            {config.columns.map((c) => (
              <DropdownMenuItem key={c.id} disabled={c.id === task.columnId} onSelect={() => onMove(c.id)}>
                <span aria-hidden="true" className="size-2 rounded-full" style={{ background: c.color }} />
                {c.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onOpen}>Open details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {!compact && (list || tags.length > 0 || due || checks > 0 || task.priority !== "none") && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[12px]">
          {task.priority !== "none" && (
            <span className="inline-flex items-center gap-1" style={{ color: priorityMeta[task.priority].color }}>
              <Flag className="size-3" aria-hidden="true" />
              {priorityMeta[task.priority].label}
            </span>
          )}
          {due && (
            <span className={cn("inline-flex items-center gap-1", toneClass[due.tone])}>
              <CalendarDays className="size-3" aria-hidden="true" />
              {due.text}
            </span>
          )}
          {checks > 0 && (
            <span className={cn("inline-flex items-center gap-1 text-muted", checked === checks && "text-[#4b6a3a]")}>
              <CheckSquare className="size-3" aria-hidden="true" />
              {checked}/{checks}
            </span>
          )}
          {list && (
            <span className="inline-flex items-center gap-1 text-muted">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ background: list.color }} />
              {list.name}
            </span>
          )}
          {tags.map((t) => (
            <span
              key={t!.id}
              className="rounded px-1.5 py-px text-[11px] font-medium"
              style={{ background: `${t!.color}22`, color: t!.color }}
            >
              {t!.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
