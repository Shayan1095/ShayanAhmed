"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  tableFeatures,
  useTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BellRing,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Kanban,
  Rows3,
  Search,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { notifyShell } from "@/components/admin/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inPipeline, money, openStages, stageLabel } from "@/lib/admin/crm";
import { dayKey, dueKey } from "@/lib/admin/dates";
import type { Inquiry, Stage } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { setInquiryStatus, updateLead } from "./actions";
import { AddLeadDialog } from "./add-lead";
import { LeadBoard, StageDot } from "./board";
import { LeadPanel } from "./lead-panel";

type Filter = "open" | "replied" | "archived";
const filterLabels: Record<Filter, string> = { open: "Waiting", replied: "Replied", archived: "Archived" };
const matches = (i: Inquiry, f: Filter) => (f === "open" ? i.status === "new" || i.status === "read" : i.status === f);

const when = (iso: string) => {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
};

/* TanStack Table (v9): only the features this table uses are registered. Module scope keeps them stable. */
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, datetime: sortFn_datetime },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const col = createColumnHelper<typeof features, Inquiry>();
const columns = col.columns([
  col.accessor("name", { header: "From", sortFn: "alphanumeric" }),
  col.accessor("projectType", { header: "Project", sortFn: "alphanumeric" }),
  col.accessor("budget", { header: "Budget", sortFn: "alphanumeric" }),
  col.accessor("message", { header: "Message", enableSorting: false }),
  col.accessor((i) => new Date(i.createdAt), { id: "received", header: "Received", sortFn: "datetime", sortDescFirst: true, enableGlobalFilter: false }),
  col.accessor((i) => stageLabel[i.stage], { id: "status", header: "Stage", sortFn: "alphanumeric" }),
  col.accessor("value", { header: "Value", sortFn: "alphanumeric", enableGlobalFilter: false }),
  // Hidden from display, still searchable.
  col.accessor("email", { header: "Email" }),
]);
const visible = ["name", "projectType", "value", "message", "received", "status"];

type View = "board" | "table";
const VIEW_KEY = "sa-leads-view";

/**
 * Leads: the pipeline as a board (drag between stages) or as a sortable,
 * searchable table (TanStack Table). Opening a lead shows it in a side panel
 * and marks it read. ?lead=<id> opens one, ?new=1 opens "Add lead".
 */
export function InboxView({
  initial,
  initialLead,
  initialNew = false,
  initialStage,
}: {
  initial: Inquiry[];
  initialLead?: string;
  initialNew?: boolean;
  initialStage?: Stage;
}) {
  const [items, setItems] = useState(initial);
  const [view, setView] = useState<View>("board");
  const [filter, setFilter] = useState<Filter>("open");
  const [openId, setOpenId] = useState<string | null>(initialLead && initial.some((i) => i.id === initialLead) ? initialLead : null);
  const [adding, setAdding] = useState(initialNew);
  const [sorting, setSorting] = useState<SortingState>([{ id: "received", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [, start] = useTransition();

  // Remembered view (per browser). Read after mount so the server render matches.
  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from browser storage
      if (v === "board" || v === "table") setView(v);
    } catch {
      /* storage blocked */
    }
  }, []);
  const pickView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* ignore */
    }
  };

  // Opened from a link (?lead=… or ?new=1): drop the query once handled so a refresh doesn't reopen it.
  useEffect(() => {
    if (initialLead || initialNew) window.history.replaceState(null, "", "/admin/inbox");
  }, [initialLead, initialNew]);

  const data = useMemo(() => items.filter((i) => matches(i, filter)), [items, filter]);
  const table = useTable({
    features,
    columns,
    data,
    getRowId: (row) => row.id,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: (u) => {
      setGlobalFilter(u);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    globalFilterFn: "includesString",
    enableSortingRemoval: false,
  });

  const open = items.find((i) => i.id === openId) ?? null;
  const shown = table.getFilteredRowModel().rows.length;

  const replace = (l: Inquiry) => setItems((xs) => xs.map((x) => (x.id === l.id ? l : x)));

  const setStatus = (id: string, status: Inquiry["status"], note?: string) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status } : x)));
    start(async () => {
      const res = await setInquiryStatus(id, status);
      if (!res.ok) return void toast.error(res.error);
      if (res.data) replace(res.data);
      notifyShell();
      if (note) toast.success(note);
    });
  };

  const move = (id: string, stage: Stage) => {
    const cur = items.find((x) => x.id === id);
    if (!cur || cur.stage === stage) return;
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, stage } : x)));
    start(async () => {
      const res = await updateLead(id, { stage });
      if (!res.ok || !res.data) {
        setItems((xs) => xs.map((x) => (x.id === id ? cur : x)));
        return void toast.error(res.ok ? "Couldn't move it" : res.error);
      }
      replace(res.data);
      notifyShell();
      toast.success(`${cur.name} → ${stageLabel[stage]}`);
    });
  };

  const select = (i: Inquiry) => {
    setOpenId(i.id);
    if (i.status === "new") setStatus(i.id, "read");
  };

  // Board shows the live pipeline (archived leads stay in the table's Archived tab).
  const q = globalFilter.trim().toLowerCase();
  const boardItems = items.filter(
    (i) => inPipeline(i) && (!q || [i.name, i.email, i.company, i.projectType, i.message].some((v) => v.toLowerCase().includes(q))),
  );
  const pipeline = items.filter((i) => inPipeline(i) && openStages.includes(i.stage));
  const client = useSyncExternalStore(noop, () => true, () => false);
  const today = client ? dayKey() : "";
  const due = client ? pipeline.filter((i) => i.followUpAt && (dueKey(i.followUpAt) ?? "9999") <= today).length : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <dl className="grid grid-cols-3 gap-3">
        {[
          { k: "Open deals", v: String(pipeline.length) },
          { k: "Pipeline value", v: money(pipeline.reduce((s, i) => s + i.value, 0), true) },
          { k: "Follow-ups due", v: String(due), alert: due > 0 },
        ].map((x) => (
          <div key={x.k} className="glass rounded-2xl px-4 py-3">
            <dt className="text-[12px] text-muted">{x.k}</dt>
            <dd className={cn("font-display text-[22px] font-extrabold leading-tight", x.alert && "text-alert")}>
              {x.alert && <BellRing className="mr-1.5 inline size-4 -translate-y-0.5" aria-hidden="true" />}
              {x.v}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="View" className="inline-flex rounded-xl border border-paper-edge/60 bg-paper-hi/60 p-0.5">
            {(
              [
                { id: "board", label: "Board", icon: Kanban },
                { id: "table", label: "Table", icon: Rows3 },
              ] as const
            ).map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={view === v.id}
                onClick={() => pickView(v.id)}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-muted hover:text-ink aria-pressed:bg-ink aria-pressed:text-paper"
              >
                <v.icon className="size-3.5" aria-hidden="true" />
                {v.label}
              </button>
            ))}
          </div>
          {view === "table" && (
            <div role="tablist" aria-label="Filter" className="inline-flex rounded-xl border border-paper-edge/60 bg-paper-hi/60 p-0.5">
              {(Object.keys(filterLabels) as Filter[]).map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => {
                    setFilter(f);
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-muted hover:text-ink aria-selected:bg-ink aria-selected:text-paper"
                >
                  {filterLabels[f]}
                  <span className="font-mono text-[11px] opacity-70">{items.filter((i) => matches(i, f)).length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search enquiries"
              placeholder="Search name, company, message…"
              value={globalFilter}
              onChange={(e) => table.setGlobalFilter(e.target.value)}
              className="h-9 bg-paper-hi/70 pl-8"
            />
          </div>
          <Button size="lg" onClick={() => setAdding(true)}>
            <UserPlus /> Add lead
          </Button>
        </div>
      </div>

      {view === "board" ? (
        <LeadBoard items={boardItems} focusStage={initialStage} onOpen={select} onMove={move} />
      ) : (
        <>
      {data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-paper-edge bg-paper-hi/60 px-4 py-10 text-center">
          <Inbox className="size-5 text-muted" aria-hidden="true" />
          <p className="text-[14px] text-muted">
            {filter === "open" ? "No one is waiting on a reply." : `Nothing ${filterLabels[filter].toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden surface rounded-2xl">
          <Table className="table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="border-paper-edge/70 hover:bg-transparent">
                  {group.headers
                    .filter((h) => visible.includes(h.column.id))
                    .map((header) => {
                      const sorted = header.column.getIsSorted();
                      return (
                        <TableHead
                          key={header.id}
                          aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                          className={cn(
                            "h-10 px-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted",
                            header.column.id === "name" && "w-[34%] md:w-[22%]",
                            header.column.id === "projectType" && "hidden w-[18%] md:table-cell",
                            header.column.id === "value" && "hidden w-[10%] lg:table-cell",
                            header.column.id === "message" && "hidden lg:table-cell",
                            header.column.id === "received" && "w-[90px]",
                            header.column.id === "status" && "w-[118px]",
                          )}
                        >
                          {header.column.getCanSort() ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex cursor-pointer items-center gap-1 hover:text-ink"
                            >
                              <table.FlexRender header={header} />
                              {sorted === "asc" ? (
                                <ArrowUp className="size-3" aria-hidden="true" />
                              ) : sorted === "desc" ? (
                                <ArrowDown className="size-3" aria-hidden="true" />
                              ) : (
                                <ArrowUpDown className="size-3 opacity-40" aria-hidden="true" />
                              )}
                            </button>
                          ) : (
                            <table.FlexRender header={header} />
                          )}
                        </TableHead>
                      );
                    })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                const i = row.original;
                return (
                  <TableRow
                    key={row.id}
                    data-state={openId === i.id ? "selected" : undefined}
                    onClick={() => select(i)}
                    className="cursor-pointer border-paper-edge/50 hover:bg-paper-edge/20 data-[state=selected]:bg-paper-edge/30"
                  >
                    <TableCell className="px-3 py-2.5">
                      {/* The name is the keyboard target for the row. */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          select(i);
                        }}
                        className="flex min-w-0 cursor-pointer flex-col text-left"
                      >
                        <span className={cn("flex items-center gap-2 truncate text-[14px]", i.status === "new" ? "font-bold" : "font-medium")}>
                          {i.status === "new" && <span aria-label="New" className="size-2 shrink-0 rounded-full bg-copper" />}
                          <span className="truncate">{i.name}</span>
                        </span>
                        <span className="truncate text-[12.5px] text-muted">{i.email}</span>
                      </button>
                    </TableCell>
                    <TableCell className="hidden truncate px-3 text-[13px] md:table-cell">{i.projectType || "—"}</TableCell>
                    <TableCell className="hidden truncate px-3 font-mono text-[12.5px] lg:table-cell">{i.value ? money(i.value, true) : "—"}</TableCell>
                    <TableCell className="hidden truncate px-3 text-[13px] text-ink/70 lg:table-cell">{i.message}</TableCell>
                    <TableCell className="px-3 font-mono text-[12px] text-muted">{when(i.createdAt)}</TableCell>
                    <TableCell className="px-3">
                      <Badge variant={i.stage === "new" ? "default" : "outline"} className="gap-1.5">
                        <StageDot stage={i.stage} />
                        {stageLabel[i.stage]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {shown === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={visible.length} className="py-8 text-center text-[14px] text-muted">
                    No enquiries match &ldquo;{globalFilter}&rdquo;.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between gap-3 border-t border-paper-edge/60 px-3 py-2 text-[12.5px] text-muted">
            <span role="status">
              {shown} {shown === 1 ? "enquiry" : "enquiries"}
              {globalFilter && " found"}
            </span>
            {table.getPageCount() > 1 && (
              <div className="flex items-center gap-1">
                <span className="mr-2 font-mono">
                  {pagination.pageIndex + 1} / {table.getPageCount()}
                </span>
                <Button variant="ghost" size="icon-sm" aria-label="Previous page" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
                  <ChevronLeft />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Next page" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
                  <ChevronRight />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}

      <Sheet open={Boolean(open)} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[580px]">
          {open && (
            <LeadPanel
              key={open.id}
              lead={open}
              onChange={replace}
              onStatus={setStatus}
              onDeleted={() => {
                setItems((xs) => xs.filter((x) => x.id !== open.id));
                setOpenId(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      <AddLeadDialog
        open={adding}
        onOpenChange={setAdding}
        onCreated={(l) => {
          setItems((xs) => [l, ...xs]);
          notifyShell();
        }}
      />
    </div>
  );
}

const noop = () => () => {};
