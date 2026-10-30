"use client";

import { useMemo, useState, useTransition } from "react";
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
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Inbox,
  Mail,
  MailCheck,
  Search,
  Trash2,
  TriangleAlert,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Inquiry } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { deleteInquiry, setInquiryStatus } from "./actions";

type Filter = "open" | "replied" | "archived";
const filterLabels: Record<Filter, string> = { open: "Waiting", replied: "Replied", archived: "Archived" };
const matches = (i: Inquiry, f: Filter) => (f === "open" ? i.status === "new" || i.status === "read" : i.status === f);
const statusLabel: Record<Inquiry["status"], string> = { new: "New", read: "Read", replied: "Replied", archived: "Archived" };

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
  col.accessor("status", { header: "Status", sortFn: "alphanumeric" }),
  // Hidden from display, still searchable.
  col.accessor("email", { header: "Email" }),
]);
const visible = ["name", "projectType", "budget", "message", "received", "status"];

/**
 * Enquiries as a sortable, searchable table (TanStack Table). The tabs split
 * waiting / replied / archived; opening one shows it in a side panel and
 * marks it read.
 */
export function InboxView({ initial }: { initial: Inquiry[] }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<Filter>("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "received", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [, start] = useTransition();

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

  const setStatus = (id: string, status: Inquiry["status"], note?: string) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status } : x)));
    start(async () => {
      const res = await setInquiryStatus(id, status);
      if (!res.ok) toast.error(res.error);
      else if (note) toast.success(note);
    });
  };

  const select = (i: Inquiry) => {
    setOpenId(i.id);
    if (i.status === "new") setStatus(i.id, "read");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Filter" className="inline-flex rounded-lg border border-paper-edge/70 bg-paper-hi p-0.5">
          {(Object.keys(filterLabels) as Filter[]).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => {
                setFilter(f);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-[13px] font-medium text-muted hover:text-ink aria-selected:bg-ink aria-selected:text-paper"
            >
              {filterLabels[f]}
              <span className="font-mono text-[11px] opacity-70">{items.filter((i) => matches(i, f)).length}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Search enquiries"
            placeholder="Search name, email, message…"
            value={globalFilter}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            className="h-9 bg-paper-hi pl-8"
          />
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-paper-edge bg-paper-hi px-4 py-10 text-center">
          <Inbox className="size-5 text-muted" aria-hidden="true" />
          <p className="text-[14px] text-muted">
            {filter === "open" ? "No one is waiting on a reply." : `Nothing ${filterLabels[filter].toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-paper-edge/70 bg-paper-hi">
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
                            header.column.id === "budget" && "hidden w-[12%] lg:table-cell",
                            header.column.id === "message" && "hidden lg:table-cell",
                            header.column.id === "received" && "w-[90px]",
                            header.column.id === "status" && "w-[96px]",
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
                    <TableCell className="hidden truncate px-3 text-[13px] lg:table-cell">{i.budget || "—"}</TableCell>
                    <TableCell className="hidden truncate px-3 text-[13px] text-ink/70 lg:table-cell">{i.message}</TableCell>
                    <TableCell className="px-3 font-mono text-[12px] text-muted">{when(i.createdAt)}</TableCell>
                    <TableCell className="px-3">
                      <Badge variant={i.status === "new" ? "default" : "outline"}>{statusLabel[i.status]}</Badge>
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

      <Sheet open={Boolean(open)} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto bg-paper-hi p-0 sm:max-w-[560px]">
          {open && (
            <Detail
              inquiry={open}
              onStatus={setStatus}
              onDeleted={() => {
                setItems((xs) => xs.filter((x) => x.id !== open.id));
                setOpenId(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Detail({
  inquiry: i,
  onStatus,
  onDeleted,
}: {
  inquiry: Inquiry;
  onStatus: (id: string, s: Inquiry["status"], note?: string) => void;
  onDeleted: () => void;
}) {
  return (
    <article className="flex min-h-full flex-col">
      <header className="flex flex-col gap-2 border-b border-paper-edge/60 p-5 pr-12">
        <SheetTitle className="font-display text-[20px] font-extrabold">{i.name}</SheetTitle>
        <SheetDescription asChild>
          <div className="flex flex-col gap-1 text-[13.5px] text-muted">
            <span className="flex items-center gap-2">
              {i.email}
              <button
                type="button"
                aria-label="Copy email"
                className="cursor-pointer rounded p-1 hover:bg-paper-edge/35"
                onClick={() => navigator.clipboard.writeText(i.email).then(() => toast.success("Email copied"))}
              >
                <Copy className="size-3.5" />
              </button>
            </span>
            <span className="text-[12.5px]">{new Date(i.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
          </div>
        </SheetDescription>
        <div className="flex flex-wrap gap-1.5">
          {i.projectType && <Badge variant="secondary">{i.projectType}</Badge>}
          {i.budget && <Badge variant="secondary">{i.budget}</Badge>}
          <Badge variant="outline">{statusLabel[i.status]}</Badge>
        </div>
      </header>
      {!i.emailed && (
        <p className="mx-5 mt-4 flex items-start gap-2 rounded-lg bg-[#b8901c]/12 px-3 py-2 text-[12.5px] text-[#6d5410]">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          The email notification for this one wasn&apos;t sent (check the Resend settings). It&apos;s saved here.
        </p>
      )}
      <p className="flex-1 whitespace-pre-wrap p-5 text-[15px] leading-relaxed">{i.message}</p>
      <footer className="flex flex-wrap items-center gap-2 border-t border-paper-edge/60 p-4">
        <a
          href={`mailto:${i.email}?subject=${encodeURIComponent("Re: your project enquiry")}`}
          className={buttonVariants({ size: "lg" })}
          onClick={() => i.status !== "replied" && onStatus(i.id, "replied")}
        >
          <Mail /> Reply by email
        </a>
        {i.status !== "replied" && (
          <Button variant="outline" size="lg" onClick={() => onStatus(i.id, "replied", "Marked as replied")}>
            <MailCheck /> Mark replied
          </Button>
        )}
        {i.status === "archived" ? (
          <Button variant="outline" size="lg" onClick={() => onStatus(i.id, "read", "Moved back to waiting")}>
            <Undo2 /> Unarchive
          </Button>
        ) : (
          <Button variant="outline" size="lg" onClick={() => onStatus(i.id, "archived", "Archived")}>
            <Archive /> Archive
          </Button>
        )}
        <div className="ml-auto">
          <ConfirmButton
            title="Delete this enquiry?"
            description={`The message from ${i.name} is removed permanently. Archive it instead to keep a record.`}
            confirmLabel="Delete"
            onConfirm={async () => {
              const res = await deleteInquiry(i.id);
              if (!res.ok) return void toast.error(res.error);
              toast.success("Deleted");
              onDeleted();
            }}
          >
            <Trash2 /> Delete
          </ConfirmButton>
        </div>
      </footer>
    </article>
  );
}
