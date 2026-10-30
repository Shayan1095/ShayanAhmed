"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarClock, Columns3, List, Plus, Search, Sun, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays, dayKey, dueKey } from "@/lib/admin/dates";
import type { PlannerConfig, Priority, Task } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { createTask, deleteTask, moveTask, updateTask } from "./actions";
import { priorityMeta, TaskCard } from "./task-card";
import { TaskDialog } from "./task-dialog";

type View = "board" | "list" | "today";

type Filters = { q: string; list: string; tag: string; priority: string };
const ALL = "__all";
const DONE_WINDOW_DAYS = 14;
const priorityRank: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };

export type PlannerView = "board" | "list" | "today";

/** Personal task planner: board, list and today views over the same tasks. */
export function Planner({ config, initial, initialView }: { config: PlannerConfig; initial: Task[]; initialView: View }) {
  const [tasks, setTasks] = useState(initial);
  const [view, setViewState] = useState<View>(initialView);
  const [filters, setFilters] = useState<Filters>({ q: "", list: ALL, tag: ALL, priority: ALL });
  const [openId, setOpenId] = useState<string | null>(null);
  const [, start] = useTransition();
  const quickAdd = useRef<HTMLInputElement>(null);

  // The view lives in the URL so a refresh or bookmark keeps it.
  const setView = (v: View) => {
    setViewState(v);
    const url = new URL(window.location.href);
    if (v === "board") url.searchParams.delete("view");
    else url.searchParams.set("view", v);
    window.history.replaceState(null, "", url);
  };

  // "N" adds a task from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key.toLowerCase() !== "n" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (t.closest("input, textarea, select, [contenteditable], [role=dialog]")) return;
      e.preventDefault();
      quickAdd.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const doneCols = useMemo(() => new Set(config.columns.filter((c) => c.done).map((c) => c.id)), [config.columns]);
  const firstOpen = config.columns.find((c) => !c.done)!.id;

  const visible = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (!q || t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q)) &&
        (filters.list === ALL || t.listId === filters.list) &&
        (filters.tag === ALL || t.tags.includes(filters.tag)) &&
        (filters.priority === ALL || t.priority === filters.priority),
    );
  }, [tasks, filters]);

  /* ---------- Mutations (optimistic, then confirmed by the server) ---------- */

  const replace = (t: Task) => setTasks((ts) => ts.map((x) => (x.id === t.id ? t : x)));

  const add = (title: string, columnId = firstOpen, extra: { due?: string | null } = {}) => {
    const temp: Task = {
      id: `temp-${Date.now()}`,
      title,
      notes: "",
      columnId,
      listId: filters.list !== ALL ? filters.list : "",
      tags: filters.tag !== ALL ? [filters.tag] : [],
      priority: "none",
      due: extra.due ?? null,
      checklist: [],
      order: Number.MAX_SAFE_INTEGER,
      completedAt: null,
      createdAt: new Date().toISOString(),
    };
    setTasks((ts) => [...ts, temp]);
    start(async () => {
      const res = await createTask({ title, columnId, listId: temp.listId, due: temp.due });
      if (!res.ok) {
        setTasks((ts) => ts.filter((x) => x.id !== temp.id));
        return void toast.error(res.error);
      }
      let created = res.data!;
      if (temp.tags.length) {
        const tagged = await updateTask(created.id, { tags: temp.tags });
        if (tagged.ok) created = tagged.data!;
      }
      setTasks((ts) => ts.map((x) => (x.id === temp.id ? created : x)));
    });
  };

  const change = (id: string, patch: Partial<Task>, immediate = true) => {
    setTasks((ts) =>
      ts.map((x) => {
        if (x.id !== id) return x;
        const next = { ...x, ...patch };
        if (patch.columnId && patch.columnId !== x.columnId) {
          next.completedAt = doneCols.has(patch.columnId) ? (x.completedAt ?? new Date().toISOString()) : null;
          next.order = Number.MAX_SAFE_INTEGER;
        }
        return next;
      }),
    );
    if (!immediate || id.startsWith("temp-")) return;
    start(async () => {
      const res = await updateTask(id, patch as Parameters<typeof updateTask>[1]);
      if (res.ok) replace(res.data!);
      else toast.error(res.error);
    });
  };

  const drop = (id: string, columnId: string, beforeId: string | null) => {
    if (id.startsWith("temp-")) return;
    const moving = tasks.find((t) => t.id === id);
    if (!moving) return;
    const column = tasks
      .filter((t) => t.columnId === columnId && t.id !== id)
      .sort((a, b) => a.order - b.order);
    const at = beforeId ? column.findIndex((t) => t.id === beforeId) : -1;
    column.splice(at < 0 ? column.length : at, 0, moving);
    const orderedIds = column.map((t) => t.id).filter((x) => !x.startsWith("temp-"));
    const orders = new Map(orderedIds.map((x, i) => [x, i + 1]));
    const wasDone = doneCols.has(moving.columnId);
    const nowDone = doneCols.has(columnId);
    setTasks((ts) =>
      ts.map((t) => {
        if (t.id === id)
          return {
            ...t,
            columnId,
            order: orders.get(t.id) ?? t.order,
            completedAt: nowDone ? (wasDone ? t.completedAt : new Date().toISOString()) : null,
          };
        return orders.has(t.id) ? { ...t, order: orders.get(t.id)! } : t;
      }),
    );
    if (nowDone && !wasDone) toast.success("Done. Nice work.");
    start(async () => {
      const res = await moveTask(id, columnId, orderedIds);
      if (res.ok) replace(res.data!);
      else toast.error(res.error);
    });
  };

  const remove = async (id: string) => {
    const res = await deleteTask(id);
    if (!res.ok) return void toast.error(res.error);
    setTasks((ts) => ts.filter((t) => t.id !== id));
    setOpenId(null);
    toast.success("Task deleted");
  };

  const open = tasks.find((t) => t.id === openId) ?? null;
  const filtered = filters.q || filters.list !== ALL || filters.tag !== ALL || filters.priority !== ALL;

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="View" className="inline-flex rounded-lg border border-paper-edge/70 bg-paper-hi p-0.5">
            {(
              [
                ["board", "Board", Columns3],
                ["list", "List", List],
                ["today", "Today", Sun],
              ] as const
            ).map(([v, label, Icon]) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-[13.5px] font-medium text-muted transition-colors hover:text-ink aria-selected:bg-ink aria-selected:text-paper"
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = quickAdd.current?.value.trim();
              if (!v) return;
              add(v, firstOpen, view === "today" ? { due: dayKey() } : {});
              quickAdd.current!.value = "";
            }}
            className="flex min-w-0 flex-1 basis-full items-center gap-2 sm:max-w-[420px] sm:basis-auto"
          >
            <Input
              ref={quickAdd}
              aria-label="New task"
              placeholder={view === "today" ? "Add a task for today  (N)" : "Add a task  (N)"}
              className="h-9 bg-paper-hi"
            />
            <Button type="submit" size="lg">
              <Plus /> Add
            </Button>
          </form>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input
              aria-label="Search tasks"
              placeholder="Search"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              className="h-8 w-44 bg-paper-hi pl-8"
            />
          </div>
          <FilterSelect
            label="List"
            value={filters.list}
            onChange={(v) => setFilters({ ...filters, list: v })}
            options={config.lists.map((l) => ({ value: l.id, label: l.name, color: l.color }))}
          />
          <FilterSelect
            label="Tag"
            value={filters.tag}
            onChange={(v) => setFilters({ ...filters, tag: v })}
            options={config.tags.map((t) => ({ value: t.id, label: t.name, color: t.color }))}
          />
          <FilterSelect
            label="Priority"
            value={filters.priority}
            onChange={(v) => setFilters({ ...filters, priority: v })}
            options={(Object.keys(priorityMeta) as Priority[]).map((p) => ({ value: p, label: priorityMeta[p].label, color: priorityMeta[p].color }))}
          />
          {filtered && (
            <Button variant="ghost" size="sm" onClick={() => setFilters({ q: "", list: ALL, tag: ALL, priority: ALL })}>
              <X /> Clear
            </Button>
          )}
        </div>
      </div>

      {view === "board" && <Board config={config} tasks={visible} doneCols={doneCols} onOpen={setOpenId} onMove={drop} onAdd={add} />}
      {view === "list" && <ListView config={config} tasks={visible} doneCols={doneCols} onOpen={setOpenId} onMove={(id, c) => change(id, { columnId: c })} />}
      {view === "today" && <TodayView config={config} tasks={visible} doneCols={doneCols} onOpen={setOpenId} onMove={(id, c) => change(id, { columnId: c })} />}

      <TaskDialog task={open} config={config} onClose={() => setOpenId(null)} onChange={change} onDelete={remove} />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; color: string }[];
}) {
  if (options.length === 0) return null;
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={`Filter by ${label.toLowerCase()}`} size="sm" className={cn("h-8 bg-paper-hi", value !== ALL && "border-ink/40")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label === "Priority" ? "priorities" : `${label.toLowerCase()}s`}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            <span aria-hidden="true" className="size-2 rounded-full" style={{ background: o.color }} />
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ---------- Board ---------- */

function Board({
  config,
  tasks,
  doneCols,
  onOpen,
  onMove,
  onAdd,
}: {
  config: PlannerConfig;
  tasks: Task[];
  doneCols: Set<string>;
  onOpen: (id: string) => void;
  onMove: (id: string, columnId: string, beforeId: string | null) => void;
  onAdd: (title: string, columnId: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [hover, setHover] = useState<{ col: string; before: string | null } | null>(null);
  const [showAllDone, setShowAllDone] = useState(false);
  const [cutoff] = useState(() => Date.now() - DONE_WINDOW_DAYS * 864e5);

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
      <div className="flex min-w-max gap-3 lg:grid lg:min-w-0" style={{ gridTemplateColumns: `repeat(${config.columns.length}, minmax(240px, 1fr))` }}>
        {config.columns.map((col) => {
          let items = tasks.filter((t) => t.columnId === col.id).sort((a, b) => a.order - b.order);
          const total = items.length;
          let hidden = 0;
          if (col.done && !showAllDone) {
            const recent = items.filter((t) => !t.completedAt || new Date(t.completedAt).getTime() >= cutoff);
            hidden = items.length - recent.length;
            items = recent.sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
          }
          const isHover = hover?.col === col.id;
          return (
            <section
              key={col.id}
              aria-label={col.name}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                // Insert before the first card whose middle is below the pointer.
                const cards = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-task-id]"));
                const before = cards.find((c) => {
                  const r = c.getBoundingClientRect();
                  return e.clientY < r.top + r.height / 2;
                });
                const b = before?.dataset.taskId ?? null;
                if (hover?.col !== col.id || hover.before !== b) setHover({ col: col.id, before: b });
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setHover(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/task") || dragId;
                if (id) onMove(id, col.id, hover?.before === id ? null : (hover?.before ?? null));
                setHover(null);
                setDragId(null);
              }}
              className={cn(
                "flex w-[272px] flex-col rounded-xl border border-paper-edge/60 bg-[#efe5d4] p-2 transition-colors lg:w-auto",
                isHover && "border-copper/60 bg-[#f1e4cd]",
              )}
            >
              <header className="flex items-center justify-between px-1.5 pb-2 pt-1">
                <h2 className="flex items-center gap-2 text-[13.5px] font-semibold">
                  <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: col.color }} />
                  {col.name}
                </h2>
                <span className="font-mono text-[11.5px] text-muted">{total}</span>
              </header>
              <ul className="flex min-h-16 flex-col gap-2">
                <AnimatePresence initial={false}>
                  {items.map((t) => (
                    <motion.li
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: dragId === t.id ? 0.4 : 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      data-task-id={t.id}
                    >
                      {isHover && hover.before === t.id && dragId !== t.id && <DropLine />}
                      <TaskCard
                        task={t}
                        config={config}
                        done={doneCols.has(t.columnId)}
                        onOpen={() => onOpen(t.id)}
                        onMove={(c) => onMove(t.id, c, null)}
                        dragProps={{
                          draggable: !t.id.startsWith("temp-"),
                          onDragStart: (e) => {
                            e.dataTransfer.setData("text/task", t.id);
                            e.dataTransfer.effectAllowed = "move";
                            setDragId(t.id);
                          },
                          onDragEnd: () => {
                            setDragId(null);
                            setHover(null);
                          },
                        }}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
                {isHover && hover.before === null && <DropLine />}
              </ul>
              {hidden > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllDone(true)}
                  className="mt-2 cursor-pointer rounded-md px-2 py-1.5 text-left text-[12.5px] text-muted hover:bg-paper-edge/30 hover:text-ink"
                >
                  Show {hidden} older
                </button>
              )}
              {!col.done && <ColumnAdd onAdd={(title) => onAdd(title, col.id)} name={col.name} />}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function DropLine() {
  return <div aria-hidden="true" className="mb-2 h-0.5 rounded-full bg-copper" />;
}

function ColumnAdd({ onAdd, name }: { onAdd: (title: string) => void; name: string }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState("");
  if (!editing)
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-2 flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[13px] text-muted hover:bg-paper-edge/30 hover:text-ink"
      >
        <Plus className="size-3.5" aria-hidden="true" /> Add task
      </button>
    );
  return (
    <form
      className="mt-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) onAdd(v.trim());
        setV("");
      }}
    >
      <Input
        autoFocus
        aria-label={`New task in ${name}`}
        value={v}
        placeholder="Task title, then Enter"
        onChange={(e) => setV(e.target.value)}
        onBlur={() => !v && setEditing(false)}
        onKeyDown={(e) => e.key === "Escape" && (setV(""), setEditing(false))}
        className="h-8 bg-paper-hi"
      />
    </form>
  );
}

/* ---------- List ---------- */

type Sort = "due" | "priority" | "created";

function ListView({
  config,
  tasks,
  doneCols,
  onOpen,
  onMove,
}: {
  config: PlannerConfig;
  tasks: Task[];
  doneCols: Set<string>;
  onOpen: (id: string) => void;
  onMove: (id: string, columnId: string) => void;
}) {
  const [sort, setSort] = useState<Sort>("due");
  const [showDone, setShowDone] = useState(false);
  const rows = tasks
    .filter((t) => showDone || !doneCols.has(t.columnId))
    .sort((a, b) => {
      if (sort === "priority") return priorityRank[a.priority] - priorityRank[b.priority];
      if (sort === "created") return b.createdAt.localeCompare(a.createdAt);
      return (dueKey(a.due) ?? "9999").localeCompare(dueKey(b.due) ?? "9999");
    });
  const firstDone = config.columns.find((c) => c.done)!.id;
  const firstOpen = config.columns.find((c) => !c.done)!.id;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-[13px]">
        <label className="flex items-center gap-2 text-muted">
          Sort by
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger size="sm" aria-label="Sort by" className="h-8 bg-paper-hi">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due">Due date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="created">Newest</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-muted">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="size-4 accent-[#c9853f]" />
          Show done
        </label>
        <span className="ml-auto font-mono text-[12px] text-muted">{rows.length} tasks</span>
      </div>
      {rows.length === 0 ? (
        <Empty text="Nothing here. Add a task above or clear the filters." />
      ) : (
        <ul className="overflow-hidden rounded-xl border border-paper-edge/70 bg-paper-hi">
          {rows.map((t) => {
            const done = doneCols.has(t.columnId);
            const col = config.columns.find((c) => c.id === t.columnId);
            return (
              <li key={t.id} className="flex items-center gap-3 border-b border-paper-edge/50 px-3 py-1.5 last:border-0">
                <input
                  type="checkbox"
                  checked={done}
                  aria-label={done ? `Reopen ${t.title}` : `Mark ${t.title} done`}
                  onChange={() => onMove(t.id, done ? firstOpen : firstDone)}
                  className="size-4 shrink-0 cursor-pointer accent-[#5d7a4a]"
                />
                <div className="min-w-0 flex-1">
                  <TaskCard task={t} config={config} done={done} onOpen={() => onOpen(t.id)} onMove={(c) => onMove(t.id, c)} />
                </div>
                <span className="hidden w-28 shrink-0 items-center gap-1.5 text-[12.5px] text-muted md:flex">
                  <span aria-hidden="true" className="size-2 rounded-full" style={{ background: col?.color }} />
                  {col?.name}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------- Today ---------- */

function TodayView({
  config,
  tasks,
  doneCols,
  onOpen,
  onMove,
}: {
  config: PlannerConfig;
  tasks: Task[];
  doneCols: Set<string>;
  onOpen: (id: string) => void;
  onMove: (id: string, columnId: string) => void;
}) {
  const today = dayKey();
  const weekEnd = addDays(today, 7);
  const open = tasks.filter((t) => !doneCols.has(t.columnId));
  const byPriority = (a: Task, b: Task) => priorityRank[a.priority] - priorityRank[b.priority];
  const overdue = open.filter((t) => (dueKey(t.due) ?? "9999") < today).sort(byPriority);
  const dueToday = open.filter((t) => dueKey(t.due) === today).sort(byPriority);
  const upcoming = open
    .filter((t) => {
      const k = dueKey(t.due);
      return k !== null && k > today && k <= weekEnd;
    })
    .sort((a, b) => (dueKey(a.due) ?? "").localeCompare(dueKey(b.due) ?? ""));
  const doneToday = tasks.filter((t) => t.completedAt && dayKey(new Date(t.completedAt)) === today);
  const firstDone = config.columns.find((c) => c.done)!.id;

  const group = (title: string, items: Task[], icon: React.ReactNode, tone?: string) =>
    items.length > 0 && (
      <section>
        <h2 className={cn("mb-2 flex items-center gap-2 text-[13.5px] font-semibold", tone)}>
          {icon}
          {title}
          <span className="font-mono text-[11.5px] font-normal text-muted">{items.length}</span>
        </h2>
        <ul className="grid gap-2 md:grid-cols-2">
          {items.map((t) => (
            <li key={t.id} className="flex items-start gap-2.5">
              <input
                type="checkbox"
                checked={doneCols.has(t.columnId)}
                aria-label={`Mark ${t.title} done`}
                onChange={() => onMove(t.id, firstDone)}
                className="mt-3.5 size-4 shrink-0 cursor-pointer accent-[#5d7a4a]"
              />
              <div className="min-w-0 flex-1">
                <TaskCard task={t} config={config} done={doneCols.has(t.columnId)} onOpen={() => onOpen(t.id)} onMove={(c) => onMove(t.id, c)} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    );

  const nothing = overdue.length + dueToday.length + upcoming.length === 0;
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-paper-edge/70 bg-paper-hi px-4 py-3 text-[13.5px]">
        <span className="font-semibold">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</span>
        <span className="text-muted">
          <strong className="text-ink">{dueToday.length}</strong> due today
        </span>
        <span className="text-muted">
          <strong className={overdue.length ? "text-[#a2353f]" : "text-ink"}>{overdue.length}</strong> overdue
        </span>
        <span className="text-muted">
          <strong className="text-[#4b6a3a]">{doneToday.length}</strong> done today
        </span>
      </div>
      {nothing && <Empty text="Nothing due this week. Give tasks a due date to plan them here." />}
      {group("Overdue", overdue, <CalendarClock className="size-4" aria-hidden="true" />, "text-[#a2353f]")}
      {group("Today", dueToday, <Sun className="size-4 text-[#8a521a]" aria-hidden="true" />)}
      {group("Next 7 days", upcoming, <CalendarClock className="size-4 text-muted" aria-hidden="true" />)}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-paper-edge bg-paper-hi px-4 py-8 text-center text-[14px] text-muted">{text}</p>;
}
