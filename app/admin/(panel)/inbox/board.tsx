"use client";

import { useState, useSyncExternalStore } from "react";
import { BellRing, GripVertical } from "lucide-react";
import { ago, money, sourceLabel, stages } from "@/lib/admin/crm";
import { dayKey, dueKey, dueLabel } from "@/lib/admin/dates";
import type { Inquiry, Stage } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

/**
 * The pipeline as a board: one column per stage, with count and value.
 * Drag a card to move it (mouse), or open it and pick a stage (keyboard).
 */
export function LeadBoard({
  items,
  focusStage,
  onOpen,
  onMove,
}: {
  items: Inquiry[];
  focusStage?: Stage;
  onOpen: (l: Inquiry) => void;
  onMove: (id: string, stage: Stage) => void;
}) {
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const client = useSyncExternalStore(subscribe, () => true, () => false);
  const today = client ? dayKey() : "";

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
      <div className="grid min-w-[1060px] grid-cols-5 gap-3">
        {stages.map((s) => {
          const col = items.filter((l) => l.stage === s.id);
          const value = col.reduce((v, l) => v + l.value, 0);
          return (
            <section
              key={s.id}
              aria-label={`${s.label}: ${col.length}`}
              onDragOver={(e) => {
                if (!drag) return;
                e.preventDefault();
                setOver(s.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (drag) onMove(drag, s.id);
                setDrag(null);
                setOver(null);
              }}
              className={cn(
                "flex min-h-[420px] flex-col rounded-2xl border border-paper-edge/45 bg-paper-hi/35 p-2 transition-colors",
                over === s.id && "border-copper/70 bg-copper/10",
                focusStage === s.id && "ring-2 ring-copper/50",
              )}
            >
              <header className="mb-2 px-2 pt-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-[13.5px] font-semibold">
                    <StageDot stage={s.id} />
                    {s.label}
                    <span className="font-mono text-[11px] font-normal text-muted">{col.length}</span>
                  </h2>
                  {value > 0 && <span className="font-mono text-[11px] text-muted">{money(value, true)}</span>}
                </div>
                <p className="mt-0.5 text-[11.5px] text-muted">{s.hint}</p>
              </header>
              <ul className="flex flex-1 flex-col gap-2">
                {col.map((l) => {
                  const due = client && l.followUpAt && (s.id === "new" || s.id === "contacted" || s.id === "proposal") ? dueLabel(l.followUpAt, today) : null;
                  const late = due && (dueKey(l.followUpAt) ?? "") <= today;
                  return (
                    <li
                      key={l.id}
                      draggable
                      onDragStart={(e) => {
                        setDrag(l.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        setDrag(null);
                        setOver(null);
                      }}
                      className={cn("group surface rounded-xl transition-[transform,box-shadow,opacity]", drag === l.id && "opacity-50", "hover:-translate-y-px hover:shadow-[0_10px_24px_-14px_rgb(17_17_17/0.45)]")}
                    >
                      <button type="button" onClick={() => onOpen(l)} className="flex w-full cursor-pointer flex-col gap-1.5 p-3 text-left">
                        <span className="flex items-start justify-between gap-2">
                          <span className="min-w-0">
                            <span className={cn("flex items-center gap-1.5 truncate text-[13.5px]", l.status === "new" ? "font-bold" : "font-semibold")}>
                              {l.status === "new" && <span aria-label="Unread" className="size-1.5 shrink-0 rounded-full bg-copper" />}
                              <span className="truncate">{l.name}</span>
                            </span>
                            <span className="block truncate text-[12px] text-muted">{l.company || l.projectType || sourceLabel[l.source] || l.source}</span>
                          </span>
                          <GripVertical className="mt-0.5 size-4 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-60" aria-hidden="true" />
                        </span>
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px]">
                          {l.value > 0 && <span className="font-mono font-semibold">{money(l.value, true)}</span>}
                          {due && (
                            <span className={cn("inline-flex items-center gap-1 font-semibold", late ? "text-alert" : "text-copper-ink")}>
                              <BellRing className="size-3" aria-hidden="true" />
                              {due.text}
                            </span>
                          )}
                          <span className="ml-auto font-mono text-muted">{client ? ago(l.createdAt) : ""}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
                {col.length === 0 && (
                  <li className="grid flex-1 place-items-center rounded-xl border border-dashed border-paper-edge/60 px-3 py-6 text-center text-[12px] text-muted">
                    {drag ? "Drop here" : "Empty"}
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

const dotClass: Record<Stage, string> = {
  new: "bg-copper",
  contacted: "bg-walnut",
  proposal: "bg-warn",
  won: "bg-good-mark",
  lost: "bg-muted",
};

export function StageDot({ stage }: { stage: Stage }) {
  return <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", dotClass[stage])} />;
}
