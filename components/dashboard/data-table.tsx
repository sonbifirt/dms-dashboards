"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Search,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

export type Column<T> = {
  key: keyof T & string;
  header: React.ReactNode;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  width?: string;
  format?: (row: T) => React.ReactNode;
  accessor?: (row: T) => string | number;
  className?: string;
};

export type Filter<T> = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  predicate: (row: T, value: string) => boolean;
};

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  searchKeys?: (keyof T & string)[];
  searchPlaceholder?: string;
  filters?: Filter<T>[];
  pageSize?: number;
  initialSort?: { key: keyof T & string; dir: "asc" | "desc" };
  toolbarExtras?: React.ReactNode;
  emptyMessage?: string;
  exportName?: string;
}

function toCsv<T>(rows: T[], columns: Column<T>[]) {
  const headers = columns.map((c) =>
    typeof c.header === "string" ? c.header : String(c.key)
  );
  const body = rows.map((r) =>
    columns
      .map((c) => {
        const val = c.accessor
          ? c.accessor(r)
          : (r[c.key] as string | number | null | undefined);
        const s = val == null ? "" : String(val);
        return `"${s.replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [headers.join(","), ...body].join("\n");
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  searchKeys,
  searchPlaceholder = "Search",
  filters,
  pageSize = 10,
  initialSort,
  toolbarExtras,
  emptyMessage = "No results found.",
  exportName = "export.csv",
}: DataTableProps<T>) {
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>(
    () => Object.fromEntries((filters ?? []).map((f) => [f.id, "all"]))
  );
  const [sort, setSort] = React.useState<
    { key: keyof T & string; dir: "asc" | "desc" } | null
  >(initialSort ?? null);
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    let arr = rows;
    const q = query.trim().toLowerCase();
    if (q && searchKeys?.length) {
      arr = arr.filter((r) =>
        searchKeys.some((k) =>
          String(r[k] ?? "")
            .toLowerCase()
            .includes(q)
        )
      );
    }
    for (const f of filters ?? []) {
      const v = filterValues[f.id];
      if (v && v !== "all") {
        arr = arr.filter((r) => f.predicate(r, v));
      }
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      const sorted = [...arr].sort((a, b) => {
        const av = col?.accessor ? col.accessor(a) : a[sort.key];
        const bv = col?.accessor ? col.accessor(b) : b[sort.key];
        if (typeof av === "number" && typeof bv === "number") {
          return sort.dir === "asc" ? av - bv : bv - av;
        }
        const as = String(av ?? "").toLowerCase();
        const bs = String(bv ?? "").toLowerCase();
        if (as < bs) return sort.dir === "asc" ? -1 : 1;
        if (as > bs) return sort.dir === "asc" ? 1 : -1;
        return 0;
      });
      return sorted;
    }
    return arr;
  }, [rows, query, filters, filterValues, sort, searchKeys, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [query, filterValues, sort]);

  function toggleSort(key: keyof T & string) {
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: "desc" };
      if (s.dir === "desc") return { key, dir: "asc" };
      return null;
    });
  }

  function handleExportCsv() {
    const csv = toCsv(filtered, columns);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleExportExcel() {
    toast({
      title: "Excel export",
      description: "Not available in this build. Use CSV to download the table data.",
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {searchKeys?.length ? (
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 pl-8"
            />
            {query ? (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setQuery("")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}

        {filters?.map((f) => (
          <select
            key={f.id}
            value={filterValues[f.id]}
            onChange={(e) =>
              setFilterValues((s) => ({ ...s, [f.id]: e.target.value }))
            }
            className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">{f.label}: All</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}

        {toolbarExtras}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="scrollbar-thin overflow-x-auto rounded-lg border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                const Icon = !active
                  ? ArrowUpDown
                  : sort?.dir === "asc"
                    ? ArrowUp
                    : ArrowDown;
                return (
                  <th
                    key={c.key}
                    style={c.width ? { width: c.width } : undefined}
                    className={cn(
                      "whitespace-nowrap px-3 py-2.5 font-semibold",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center"
                    )}
                  >
                    {c.sortable ? (
                      <button
                        onClick={() => toggleSort(c.key)}
                        className={cn(
                          "inline-flex items-center gap-1 hover:text-foreground",
                          active && "text-foreground"
                        )}
                      >
                        {c.header}
                        <Icon className="h-3 w-3" />
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-t border-border/70 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-accent/50"
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "whitespace-nowrap px-3 py-2.5 align-middle",
                      c.align === "right" && "text-right tabular-nums",
                      c.align === "center" && "text-center",
                      c.className
                    )}
                  >
                    {c.format
                      ? c.format(row)
                      : ((row[c.key] as React.ReactNode) ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div>
          Showing{" "}
          <span className="font-semibold text-foreground">
            {filtered.length === 0 ? 0 : start + 1}–
            {Math.min(filtered.length, start + pageSize)}
          </span>{" "}
          of <span className="font-semibold text-foreground">{filtered.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={current <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-2 text-xs">
            Page <span className="font-semibold text-foreground">{current}</span>{" "}
            / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={current >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
