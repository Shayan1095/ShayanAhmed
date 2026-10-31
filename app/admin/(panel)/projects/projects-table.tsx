"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Reorder, useDragControls } from "motion/react";
import { ArrowDown, ArrowUp, GripVertical, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { ProjectRow } from "@/lib/admin/data";
import { patchProject, reorderProjects } from "../content-actions";

const statusText = { client: "Client", product: "Product", confidential: "Confidential" } as const;

/** Drag (or use the arrows) to reorder; toggles save immediately. */
export function ProjectsTable({ initial }: { initial: ProjectRow[] }) {
  const [rows, setRows] = useState(initial);
  const [, start] = useTransition();

  const saveOrder = (next: ProjectRow[]) =>
    start(async () => {
      const res = await reorderProjects(next.map((r) => r.id));
      if (res.ok) toast.success("Order saved");
      else toast.error(res.error);
    });

  const move = (i: number, d: -1 | 1) => {
    const next = [...rows];
    const [r] = next.splice(i, 1);
    next.splice(i + d, 0, r);
    setRows(next);
    saveOrder(next);
  };

  const patch = (id: string, p: { featured?: boolean; published?: boolean }) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    start(async () => {
      const res = await patchProject(id, p);
      if (!res.ok) toast.error(res.error);
    });
  };

  if (rows.length === 0) return <p className="text-muted">No projects yet. Add your first one.</p>;

  return (
    <div className="overflow-hidden surface rounded-2xl">
      <div className="hidden grid-cols-[28px_minmax(0,1fr)_120px_96px_96px_72px] items-center gap-3 border-b border-paper-edge/70 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted md:grid">
        <span />
        <span>Project</span>
        <span>Status</span>
        <span>Featured</span>
        <span>Live</span>
        <span />
      </div>
      <Reorder.Group axis="y" values={rows} onReorder={setRows} as="ol">
        {rows.map((r, i) => (
          <Row key={r.id} row={r} index={i} count={rows.length} onDrop={() => saveOrder(rows)} onMove={move} onPatch={patch} />
        ))}
      </Reorder.Group>
    </div>
  );
}

function Row({
  row,
  index,
  count,
  onDrop,
  onMove,
  onPatch,
}: {
  row: ProjectRow;
  index: number;
  count: number;
  onDrop: () => void;
  onMove: (i: number, d: -1 | 1) => void;
  onPatch: (id: string, p: { featured?: boolean; published?: boolean }) => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDrop}
      className="relative grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 border-b border-paper-edge/50 bg-paper-hi px-4 py-3 last:border-0 md:grid-cols-[28px_minmax(0,1fr)_120px_96px_96px_72px]"
    >
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onPointerDown={(e) => controls.start(e)}
        className="grid h-8 cursor-grab touch-none place-items-center text-muted active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0">
        <Link href={`/admin/projects/${row.id}`} className="font-semibold hover:underline">
          {row.title}
        </Link>
        <p className="truncate text-[13px] text-muted">
          {row.kind || row.category}
          {row.hasCaseStudy && " · case study"}
        </p>
      </div>
      <div className="hidden md:block">
        <Badge variant="outline">{row.statusLabel || statusText[row.status]}</Badge>
      </div>
      <div className="hidden md:block">
        <Switch
          checked={row.featured}
          onCheckedChange={(v) => onPatch(row.id, { featured: v })}
          aria-label={`Feature ${row.title}`}
        />
      </div>
      <div className="hidden md:block">
        <Switch
          checked={row.published}
          onCheckedChange={(v) => onPatch(row.id, { published: v })}
          aria-label={`Publish ${row.title}`}
        />
      </div>
      <div className="flex items-center justify-end gap-0.5">
        <Button variant="ghost" size="icon-sm" aria-label={`Move ${row.title} up`} disabled={index === 0} onClick={() => onMove(index, -1)}>
          <ArrowUp />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Move ${row.title} down`}
          disabled={index === count - 1}
          onClick={() => onMove(index, 1)}
        >
          <ArrowDown />
        </Button>
        <Link href={`/admin/projects/${row.id}`} aria-label={`Edit ${row.title}`} className="grid size-7 place-items-center rounded-md hover:bg-paper-edge/35 md:hidden">
          <Pencil className="size-3.5" />
        </Link>
      </div>
    </Reorder.Item>
  );
}
