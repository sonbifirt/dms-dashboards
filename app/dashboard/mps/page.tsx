"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Banknote,
  CreditCard,
  MonitorSmartphone,
  PowerOff,
  Receipt,
  RotateCw,
  Wallet,
} from "lucide-react";

import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SegmentToggle } from "@/components/dashboard/segment-toggle";
import { StatusBadge, kioskStatusTone } from "@/components/dashboard/status-badge";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import {
  ChartTooltip,
  compactCurrencyFormatter,
} from "@/components/dashboard/chart-tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type PresetId } from "@/components/dashboard/date-range-picker";
import {
  KPI,
  TOTAL_CARD,
  TOTAL_CASH,
  TOTAL_TURNOVER,
  kioskStatusSegment,
  kioskStatusBreakdown,
  topByCity,
  topKiosks,
} from "@/lib/aggregations";
import { kiosks } from "@/lib/data/kiosks";
import type { Kiosk } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { translateKioskStatus } from "@/lib/i18n/kiosk-status";

const STATUS_COLORS: Record<string, string> = {
  OK: "#10B981",
  "Paper Warning": "#F59E0B",
  Error: "#EF4444",
  Disabled: "#94A3B8",
  "Not Found": "#3B82F6",
};

export default function MpsDashboardPage() {
  const { t } = useI18n();
  const [preset, setPreset] = React.useState<PresetId>("month");
  const [by, setBy] = React.useState<"totalAmount" | "totalCount">("totalAmount");
  const [, setNonce] = React.useState(0);
  const [selected, setSelected] = React.useState<Kiosk | null>(null);
  const [statusDrilldown, setStatusDrilldown] = React.useState<string | null>(null);

  const statusBreak = kioskStatusBreakdown();
  const top = topKiosks(20, by);
  const cities = topByCity(kiosks, by).slice(0, 8);

  const columns: Column<Kiosk>[] = React.useMemo(
    () => [
      { key: "id", header: t("dashboard.mps.colKioskId"), sortable: true, width: "110px" },
      { key: "name", header: t("dashboard.mps.colLocation"), sortable: true },
      { key: "city", header: t("dashboard.mps.colCity"), sortable: true },
      {
        key: "status",
        header: t("dashboard.mps.colStatus"),
        format: (r) => (
          <StatusBadge tone={kioskStatusTone(r.status)}>
            {translateKioskStatus(r.status, t)}
          </StatusBadge>
        ),
      },
      {
        key: "cashCount",
        header: t("dashboard.mps.colCashNum"),
        align: "right",
        sortable: true,
        format: (r) => formatNumber(r.cashCount, { maximumFractionDigits: 0 }),
      },
      {
        key: "cashAmount",
        header: t("dashboard.mps.colCashTl"),
        align: "right",
        sortable: true,
        format: (r) => formatCurrency(r.cashAmount, "TRY", { maximumFractionDigits: 0 }),
      },
      {
        key: "cardCount",
        header: t("dashboard.mps.colCardNum"),
        align: "right",
        sortable: true,
        format: (r) => formatNumber(r.cardCount, { maximumFractionDigits: 0 }),
      },
      {
        key: "cardAmount",
        header: t("dashboard.mps.colCardTl"),
        align: "right",
        sortable: true,
        format: (r) => formatCurrency(r.cardAmount, "TRY", { maximumFractionDigits: 0 }),
      },
      {
        key: "totalAmount",
        header: t("dashboard.mps.colTotalTl"),
        align: "right",
        sortable: true,
        format: (r) => (
          <span className="font-semibold">
            {formatCurrency(r.totalAmount, "TRY", { maximumFractionDigits: 0 })}
          </span>
        ),
      },
      { key: "lastActivity", header: t("dashboard.mps.colLastTx"), sortable: true, width: "150px" },
    ],
    [t]
  );

  const statusDrillColumns: Column<Kiosk>[] = React.useMemo(
    () => [
      { key: "id", header: t("dashboard.mps.colKioskId"), sortable: true, width: "110px" },
      { key: "name", header: t("dashboard.mps.colLocation"), sortable: true },
      {
        key: "status",
        header: t("dashboard.mps.colStatus"),
        sortable: true,
        accessor: (r) => kioskStatusSegment(r),
        format: (r) => {
          const seg = kioskStatusSegment(r);
          return (
            <StatusBadge tone={kioskStatusTone(seg)}>
              {translateKioskStatus(seg, t)}
            </StatusBadge>
          );
        },
      },
    ],
    [t]
  );

  const statusDrillRows = React.useMemo(
    () =>
      statusDrilldown
        ? kiosks.filter((k) => kioskStatusSegment(k) === statusDrilldown)
        : [],
    [statusDrilldown]
  );

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={t("dashboard.mps.title")}
        subtitle={t("dashboard.mps.subtitle")}
        preset={preset}
        onPresetChange={setPreset}
        onRefresh={() => setNonce((n) => n + 1)}
        trailing={
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href="/dashboard/mps/encashment">
              <Receipt className="h-3.5 w-3.5" />
              {t("dashboard.mps.encashmentCta")}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("dashboard.mps.kpiDms")}
          value={TOTAL_TURNOVER}
          format={(v) => formatCurrency(v, "TRY", { maximumFractionDigits: 0 })}
          icon={Wallet}
          sub={t("dashboard.mps.kpiDmsSub", { n: formatNumber(KPI.dmsTx) })}
          tone="brand"
          delta={{ value: 6.2, label: t("common.mom") }}
        />
        <KpiCard
          label={t("dashboard.mps.kpiCash")}
          value={TOTAL_CASH}
          format={(v) => formatCurrency(v, "TRY", { maximumFractionDigits: 0 })}
          icon={Banknote}
          sub={t("dashboard.mps.subAcrossKiosks")}
          tone="warning"
        />
        <KpiCard
          label={t("dashboard.mps.kpiCard")}
          value={TOTAL_CARD}
          format={(v) => formatCurrency(v, "TRY", { maximumFractionDigits: 0 })}
          icon={CreditCard}
          sub={t("dashboard.mps.subAcrossKiosks")}
          tone="info"
        />
        <KpiCard
          label={t("dashboard.mps.kpiTotalKiosks")}
          value={KPI.totalKiosks}
          icon={MonitorSmartphone}
          sub={t("dashboard.mps.kpiTotalKiosksSub", { n: KPI.activeKiosks })}
          tone="brand"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title={t("dashboard.mps.top20Title")}
          description={
            by === "totalAmount"
              ? t("dashboard.mps.top20DescTurnover")
              : t("dashboard.mps.top20DescCount")
          }
          actions={
            <SegmentToggle
              value={by}
              onChange={(v) => setBy(v)}
              options={[
                { id: "totalAmount", label: t("common.revenue") },
                { id: "totalCount", label: t("common.count") },
              ]}
            />
          }
          contentClassName="h-[400px] min-h-0"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={top.map((k) => ({
                id: k.id,
                label: `${k.id} · ${k.name}`.length > 42 ? `${k.id} · ${k.name.slice(0, 32)}…` : `${k.id} · ${k.name}`,
                value: by === "totalAmount" ? k.totalAmount : k.totalCount,
                full: k,
              }))}
              margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                horizontal={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={
                  by === "totalAmount"
                    ? compactCurrencyFormatter
                    : (v: number) => formatNumber(v, { maximumFractionDigits: 0 })
                }
              />
              <YAxis
                type="category"
                dataKey="label"
                width={200}
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    valueFormatter={
                      by === "totalAmount"
                        ? compactCurrencyFormatter
                        : (v: number) => formatNumber(v, { maximumFractionDigits: 0 })
                    }
                  />
                }
              />
              <Bar
                dataKey="value"
                fill="#E74C3C"
                radius={[0, 6, 6, 0]}
                onClick={(entry) => {
                  const k = (entry as { full?: Kiosk }).full;
                  if (k) {
                    setStatusDrilldown(null);
                    setSelected(k);
                  }
                }}
                style={{ cursor: "pointer" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t("dashboard.mps.kioskStatusTitle")}
          description={t("dashboard.mps.kioskStatusDesc")}
          contentClassName="flex h-[400px] min-h-0 flex-col"
        >
          <div className="relative h-[220px] w-full min-h-0 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusBreak}
                innerRadius={55}
                outerRadius={85}
                paddingAngle={1.5}
                dataKey="value"
                nameKey="name"
                style={{ outline: "none" }}
                className="cursor-pointer [&_*]:cursor-pointer"
              >
                {statusBreak.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] ?? "#94A3B8"}
                    stroke="transparent"
                    className="cursor-pointer outline-none"
                    style={{ cursor: "pointer" }}
                    onClick={() => setStatusDrilldown(entry.name)}
                  />
                ))}
              </Pie>
              <Tooltip
                content={
                  <ChartTooltip
                    valueFormatter={(v) => formatNumber(v, { maximumFractionDigits: 0 })}
                    suffix={t("common.kiosks")}
                  />
                }
              />
            </PieChart>
          </ResponsiveContainer>
          </div>
          <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 content-start gap-1.5 overflow-y-auto text-xs">
            {statusBreak.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => setStatusDrilldown(s.name)}
                className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[s.name] }}
                />
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {translateKioskStatus(s.name, t)}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{s.value}</span>
              </button>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title={t("dashboard.mps.chartCityTitle")} contentClassName="h-[320px] min-h-0">
          <div className="h-[280px] w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cities}
                margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
              >
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="city"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={64}
              />
              <YAxis
                type="number"
                scale="sqrt"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={compactCurrencyFormatter}
                axisLine={false}
                tickLine={false}
                domain={[0, "dataMax"]}
                width={60}
              />
              <Tooltip
                content={
                  <ChartTooltip valueFormatter={compactCurrencyFormatter} />
                }
              />
              <Bar
                dataKey="total"
                name={t("common.total")}
                fill="#E74C3C"
                radius={[5, 5, 0, 0]}
                maxBarSize={48}
                minPointSize={3}
              />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t("dashboard.mps.chartCityCashTitle")} contentClassName="h-[320px] min-h-0">
          <div className="h-[280px] w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cities}
                margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
                barCategoryGap="14%"
                barGap={3}
              >
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="city"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={68}
              />
              <YAxis
                type="number"
                scale="sqrt"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={compactCurrencyFormatter}
                axisLine={false}
                tickLine={false}
                domain={[0, "dataMax"]}
                allowDataOverflow={false}
                width={60}
              />
              <Tooltip
                content={
                  <ChartTooltip valueFormatter={compactCurrencyFormatter} />
                }
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
              <Bar
                dataKey="cash"
                name={t("common.cash")}
                fill="#EAB308"
                radius={[3, 3, 0, 0]}
                maxBarSize={44}
                minPointSize={4}
              />
              <Bar
                dataKey="card"
                name={t("common.card")}
                fill="#3B82F6"
                radius={[3, 3, 0, 0]}
                maxBarSize={44}
                minPointSize={4}
              />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title={t("dashboard.mps.topServices")} contentClassName="h-[240px] min-h-0">
        <div className="h-[200px] w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={[
              { name: "Turkcell", value: 128400 },
              { name: "Vodafone", value: 94200 },
              { name: "Baylan", value: 71800 },
              { name: "Utilities bundle", value: 55100 },
              { name: "Gaming / PIN", value: 38400 },
            ]}
            margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={compactCurrencyFormatter}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip valueFormatter={compactCurrencyFormatter} />} />
            <Bar dataKey="value" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </ChartCard>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm">{t("dashboard.mps.allKiosks")}</CardTitle>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {t("dashboard.mps.allKiosksSub", { n: kiosks.length })}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<Kiosk>
            rows={kiosks}
            columns={columns}
            rowKey={(k) => k.id}
            onRowClick={(k) => {
              setStatusDrilldown(null);
              setSelected(k);
            }}
            searchKeys={["id", "name", "city"]}
            searchPlaceholder={t("dashboard.mps.searchKiosks")}
            pageSize={10}
            initialSort={{ key: "totalAmount", dir: "desc" }}
            exportName="kiosks.csv"
            filters={[
              {
                id: "status",
                label: t("common.status"),
                options: [
                  { value: "OK", label: translateKioskStatus("OK", t) },
                  { value: "Paper Warning", label: translateKioskStatus("Paper Warning", t) },
                  { value: "Error", label: translateKioskStatus("Error", t) },
                  { value: "Disabled", label: translateKioskStatus("Disabled", t) },
                  { value: "Not Found", label: translateKioskStatus("Not Found", t) },
                ],
                predicate: (k, v) => kioskStatusSegment(k) === v,
              },
              {
                id: "city",
                label: t("dashboard.mps.filterCity"),
                options: Array.from(new Set(kiosks.map((k) => k.city)))
                  .sort()
                  .map((c) => ({ value: c, label: c })),
                predicate: (k, v) => k.city === v,
              },
            ]}
          />
        </CardContent>
      </Card>

      <Sheet
        open={Boolean(statusDrilldown)}
        onOpenChange={(o) => !o && setStatusDrilldown(null)}
      >
        <SheetContent className="flex max-h-[90vh] w-full flex-col overflow-hidden sm:max-w-2xl">
          <SheetHeader className="shrink-0 space-y-1 pr-8 text-left">
            <SheetTitle>
              {statusDrilldown ? translateKioskStatus(statusDrilldown, t) : ""}
            </SheetTitle>
            <SheetDescription>
              {statusDrilldown
                ? t("dashboard.mps.statusDrillDesc", {
                    n: statusDrillRows.length,
                  })
                : ""}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-auto pt-2">
            <DataTable<Kiosk>
              rows={statusDrillRows}
              columns={statusDrillColumns}
              rowKey={(k) => k.id}
              searchKeys={["id", "name"]}
              searchPlaceholder={t("dashboard.mps.searchKiosks")}
              pageSize={10}
              initialSort={{ key: "name", dir: "asc" }}
              exportName={
                statusDrilldown
                  ? `kiosks-${statusDrilldown.replace(/\s+/g, "-").toLowerCase()}.csv`
                  : "kiosks.csv"
              }
            />
          </div>
        </SheetContent>
      </Sheet>

      <KioskDetailSheet
        open={Boolean(selected)}
        onOpenChange={(o) => !o && setSelected(null)}
        kiosk={selected}
      />
    </div>
  );
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseInputDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

function daysInclusive(a: Date, b: Date): number {
  const start = startOfDay(a);
  const end = startOfDay(b);
  if (end < start) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

const SHEET_CHART_MAX_DAYS = 90;

/** Inclusive range; splits kiosk cash/card totals across days (illustrative). */
function kioskDailyCashCardSeries(
  kiosk: Kiosk,
  rangeStart: Date,
  rangeEnd: Date
): { day: string; cash: number; card: number }[] {
  const start = startOfDay(rangeStart);
  const end = startOfDay(rangeEnd);
  if (end < start) return [];
  let days = daysInclusive(start, end);
  if (days < 1) return [];
  if (days > SHEET_CHART_MAX_DAYS) {
    days = SHEET_CHART_MAX_DAYS;
  }
  const weights: number[] = [];
  for (let i = 0; i < days; i++) {
    let h = 0;
    const seed = `${kiosk.id}-${i}-${start.getTime()}`;
    for (let j = 0; j < seed.length; j++) {
      h = (h * 31 + seed.charCodeAt(j)) | 0;
    }
    weights.push(0.35 + Math.abs(Math.sin(h * 0.001)) * 0.9);
  }
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const rows = weights.map((w, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const wd = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = d.getDate();
    const mon = d.getMonth() + 1;
    return {
      day: `${wd} ${dayNum}/${mon}`,
      cash: Math.round((kiosk.cashAmount * w) / sum),
      card: Math.round((kiosk.cardAmount * w) / sum),
    };
  });
  const cashSum = rows.reduce((a, r) => a + r.cash, 0);
  const cardSum = rows.reduce((a, r) => a + r.card, 0);
  if (rows.length) {
    rows[rows.length - 1].cash += kiosk.cashAmount - cashSum;
    rows[rows.length - 1].card += kiosk.cardAmount - cardSum;
  }
  return rows;
}

function KioskDetailSheet({
  open,
  onOpenChange,
  kiosk,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kiosk: Kiosk | null;
}) {
  const { t } = useI18n();
  const [fromInput, setFromInput] = React.useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    return toInputDate(start);
  });
  const [toInput, setToInput] = React.useState(() => toInputDate(new Date()));

  React.useEffect(() => {
    if (!open || !kiosk) return;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    setToInput(toInputDate(end));
    setFromInput(toInputDate(start));
  }, [open, kiosk?.id]);

  const rangeStart = parseInputDate(fromInput);
  const rangeEnd = parseInputDate(toInput);
  const rangeOk = Boolean(rangeStart && rangeEnd && rangeStart <= rangeEnd);
  const spanDays =
    rangeOk && rangeStart && rangeEnd
      ? daysInclusive(rangeStart, rangeEnd)
      : 0;
  const rangeCapped = rangeOk && spanDays > SHEET_CHART_MAX_DAYS;
  const dailySeries =
    rangeOk && kiosk ? kioskDailyCashCardSeries(kiosk, rangeStart!, rangeEnd!) : [];

  function applyPresetDayCount(n: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (n - 1));
    setToInput(toInputDate(end));
    setFromInput(toInputDate(start));
  }

  if (!kiosk) return null;
  const cashPct =
    kiosk.totalAmount > 0 ? (kiosk.cashAmount / kiosk.totalAmount) * 100 : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
              <MonitorSmartphone className="h-5 w-5" />
            </span>
            <div>
              <SheetTitle className="flex items-center gap-2">
                {kiosk.id}{" "}
                <StatusBadge tone={kioskStatusTone(kiosk.status)}>
                  {translateKioskStatus(kiosk.status, t)}
                </StatusBadge>
              </SheetTitle>
              <SheetDescription>
                {kiosk.name} · {kiosk.city}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <DetailRow
              icon={<Receipt className="h-3.5 w-3.5" />}
              label={t("dashboard.mps.labelTransactions")}
              value={formatNumber(kiosk.totalCount)}
            />
            <DetailRow
              icon={<Wallet className="h-3.5 w-3.5" />}
              label={t("dashboard.mps.labelTotalTurnover")}
              value={formatCurrency(kiosk.totalAmount, "TRY", {
                maximumFractionDigits: 0,
              })}
            />
            <DetailRow
              icon={<Banknote className="h-3.5 w-3.5" />}
              label={t("common.cash")}
              value={`${formatCurrency(kiosk.cashAmount, "TRY", {
                maximumFractionDigits: 0,
              })} · ${kiosk.cashCount} ${t("common.tx")}`}
            />
            <DetailRow
              icon={<CreditCard className="h-3.5 w-3.5" />}
              label={t("common.card")}
              value={`${formatCurrency(kiosk.cardAmount, "TRY", {
                maximumFractionDigits: 0,
              })} · ${kiosk.cardCount} ${t("common.tx")}`}
            />
            <DetailRow
              icon={<RotateCw className="h-3.5 w-3.5" />}
              label={t("dashboard.mps.labelLastActivity")}
              value={kiosk.lastActivity}
            />
            <DetailRow
              icon={<PowerOff className="h-3.5 w-3.5" />}
              label={t("common.detail")}
              value={kiosk.statusDetail}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <Flag label={t("dashboard.mps.labelMonitors")} value={String(kiosk.monitors)} />
            <Flag
              label={t("dashboard.mps.labelPaper")}
              value={kiosk.paperStatus}
              tone={kiosk.paperStatus === "OK" ? "muted" : "warning"}
            />
            <Flag
              label={t("dashboard.mps.labelBanknote")}
              value={kiosk.bankNoteStatus}
              tone={
                kiosk.bankNoteStatus === "OK"
                  ? "muted"
                  : kiosk.bankNoteStatus === "Error"
                    ? "danger"
                    : "muted"
              }
            />
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("common.cashCardMix")}</span>
              <span className="tabular-nums font-semibold">
                {t("common.pctCash", { n: cashPct.toFixed(1) })}
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-warning" style={{ width: `${cashPct}%` }} />
              <div
                className="h-full bg-info"
                style={{ width: `${Math.max(0, 100 - cashPct)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{t("common.cashLabel")}</span>
              <span>{t("common.cardLabel")}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("dashboard.mps.sheetDailyCashCardTitle")}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t("dashboard.mps.sheetDailyCashCardDesc")}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => applyPresetDayCount(7)}
                >
                  {t("dashboard.mps.sheetRangePreset7")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => applyPresetDayCount(30)}
                >
                  {t("dashboard.mps.sheetRangePreset30")}
                </Button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="kiosk-chart-from"
                  className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {t("dashboard.mps.sheetRangeFrom")}
                </label>
                <Input
                  id="kiosk-chart-from"
                  type="date"
                  value={fromInput}
                  onChange={(e) => setFromInput(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="kiosk-chart-to"
                  className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {t("dashboard.mps.sheetRangeTo")}
                </label>
                <Input
                  id="kiosk-chart-to"
                  type="date"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            {!rangeOk ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {t("dashboard.mps.sheetRangeInvalid")}
              </p>
            ) : null}
            {rangeCapped ? (
              <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-500">
                {t("dashboard.mps.sheetRangeCapped", { n: SHEET_CHART_MAX_DAYS })}
              </p>
            ) : null}
            <div className="mt-3 h-[200px] w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailySeries}
                  margin={{ left: -18, right: 4, top: 8, bottom: 4 }}
                  barCategoryGap="14%"
                  barGap={4}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    interval={dailySeries.length > 18 ? Math.floor(dailySeries.length / 10) : 0}
                    angle={-22}
                    textAnchor="end"
                    height={dailySeries.length > 18 ? 52 : 44}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={compactCurrencyFormatter}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip
                    content={<ChartTooltip valueFormatter={compactCurrencyFormatter} />}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Bar
                    dataKey="cash"
                    name={t("common.cash")}
                    fill="#EAB308"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="card"
                    name={t("common.card")}
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Flag({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "muted" | "warning" | "danger" | "success";
}) {
  const toneClass: Record<string, string> = {
    muted: "border-border bg-muted text-muted-foreground",
    warning: "border-warning/30 bg-warning/10 text-warning",
    danger: "border-destructive/30 bg-destructive/10 text-destructive",
    success: "border-success/30 bg-success/10 text-success",
  };
  return (
    <div className={cn("rounded-md border p-2", toneClass[tone])}>
      <div className="text-[10px] uppercase tracking-wider opacity-75">
        {label}
      </div>
      <div className="mt-0.5 text-xs font-semibold">{value}</div>
    </div>
  );
}
