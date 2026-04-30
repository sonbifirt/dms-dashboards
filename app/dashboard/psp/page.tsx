"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Gauge,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { SegmentToggle } from "@/components/dashboard/segment-toggle";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type PresetId } from "@/components/dashboard/date-range-picker";
import {
  KPI,
  MERCHANT_MONTH_TURNOVER,
  monthlyTurnoverSeries,
  topMerchants,
} from "@/lib/aggregations";
import { merchants } from "@/lib/data/merchants";
import {
  OWN_PRODUCT_DAILY_CHART_MAX_DAYS,
  type OwnProductId,
  ownProductCashCardAmounts,
  ownProductDailyCashCardSeries,
  ownProductMonthlyTrend,
  ownProductSnapshot,
} from "@/lib/data/psp-own-products";
import type { Merchant } from "@/lib/data/types";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { merchantStatusLabel } from "@/lib/i18n/merchant-status";

type OwnProductConfig = {
  id: OwnProductId;
  icon: React.ComponentType<{ className?: string }>;
  iconWrap: string;
};

const OWN_PRODUCT_LIST: OwnProductConfig[] = [
  {
    id: "adakart",
    icon: Smartphone,
    iconWrap: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  {
    id: "kartbuy",
    icon: CreditCard,
    iconWrap: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
];

const OWN_TITLE: Record<OwnProductId, MessageKey> = {
  adakart: "dashboard.psp.own.adakart.title",
  kartbuy: "dashboard.psp.own.kartbuy.title",
  paypointCyprus: "dashboard.psp.own.paypointCyprus.title",
};

const OWN_SUB: Record<OwnProductId, MessageKey> = {
  adakart: "dashboard.psp.own.adakart.sub",
  kartbuy: "dashboard.psp.own.kartbuy.sub",
  paypointCyprus: "dashboard.psp.own.paypointCyprus.sub",
};

export default function PspDashboardPage() {
  const { t } = useI18n();
  const [preset, setPreset] = React.useState<PresetId>("month");
  const [, setNonce] = React.useState(0);
  const [by, setBy] = React.useState<"monthTurnover" | "txCount">("monthTurnover");
  const [selected, setSelected] = React.useState<Merchant | null>(null);
  const [ownProduct, setOwnProduct] = React.useState<OwnProductId | null>(null);

  const top = topMerchants(25, by);
  const trend = monthlyTurnoverSeries(12);
  const topRevenue3 = React.useMemo(
    () => [...merchants].sort((a, b) => b.monthTurnover - a.monthTurnover).slice(0, 3),
    []
  );
  const activeMerchants = merchants.filter((m) => m.status === "Active").length;
  const avgTicket = React.useMemo(() => {
    const total = merchants.reduce((a, m) => a + m.monthTurnover, 0);
    const tx = merchants.reduce((a, m) => a + m.txCount, 0);
    return tx > 0 ? total / tx : 0;
  }, []);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={t("dashboard.psp.title")}
        subtitle={t("dashboard.psp.subtitle")}
        preset={preset}
        onPresetChange={setPreset}
        onRefresh={() => setNonce((n) => n + 1)}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5">
        <KpiCard
          label={t("dashboard.psp.kpiToday")}
          value={KPI.pspTodayTurnover}
          format={(v) => formatCurrency(v, "TRY", { maximumFractionDigits: 0 })}
          icon={Wallet}
          delta={{ value: 3.8, label: t("common.dod") }}
          tone="info"
        />
        <KpiCard
          label={t("dashboard.psp.kpiMonth")}
          value={MERCHANT_MONTH_TURNOVER}
          format={(v) => formatCurrency(v, "TRY", { maximumFractionDigits: 0 })}
          icon={TrendingUp}
          delta={{ value: 9.6, label: t("common.mom") }}
          tone="brand"
        />
        <KpiCard
          label={t("dashboard.psp.kpiAvgTicket")}
          value={avgTicket}
          format={(v) => formatCurrency(v, "TRY", { maximumFractionDigits: 0 })}
          icon={Gauge}
          sub={t("dashboard.psp.subAvg")}
          tone="info"
        />
        <KpiCard
          label={t("dashboard.psp.kpiSuccess")}
          value={98.24}
          format={(v) => `${v.toFixed(2)}%`}
          icon={CheckCircle2}
          sub={t("dashboard.psp.subLast30")}
          tone="success"
          delta={{ value: 0.4 }}
        />
        <KpiCard
          label={t("dashboard.psp.kpiMerchants")}
          value={KPI.pspMerchants}
          icon={ShoppingBag}
          sub={t("dashboard.psp.subActive", { n: activeMerchants })}
          tone="brand"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("dashboard.psp.ownProductsTitle")}</CardTitle>
          <p className="text-xs text-muted-foreground">{t("dashboard.psp.ownProductsDesc")}</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {OWN_PRODUCT_LIST.map(({ id, icon: Icon, iconWrap }) => {
              const snap = ownProductSnapshot(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setOwnProduct(id)}
                  className={cn(
                    "group flex flex-col rounded-xl border border-border bg-card p-4 text-left transition-colors",
                    "hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                        iconWrap
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </div>
                  <div className="mt-3 font-semibold leading-tight">
                    {t(OWN_TITLE[id])}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                    {t(OWN_SUB[id])}
                  </p>
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-border/60 pt-3 text-sm">
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(snap.monthAmount, "TRY", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {formatNumber(snap.monthTx, { maximumFractionDigits: 0 })}{" "}
                      {t("common.tx")}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "mt-1 text-[11px] tabular-nums",
                      snap.momPct >= 0 ? "text-success" : "text-destructive"
                    )}
                  >
                    {t("dashboard.psp.own.sheetMom", {
                      n: snap.momPct.toFixed(1),
                    })}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title={t("dashboard.psp.topMerchants")}
          description={
            by === "monthTurnover"
              ? t("dashboard.psp.topMerchantsByRev")
              : t("dashboard.psp.topMerchantsByTx")
          }
          actions={
            <SegmentToggle
              value={by}
              onChange={(v) => setBy(v)}
              options={[
                { id: "monthTurnover", label: t("common.revenue") },
                { id: "txCount", label: t("common.count") },
              ]}
            />
          }
          contentClassName="h-[480px] min-h-0"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={top.map((m) => ({
                label:
                  m.name.length > 28
                    ? `${m.name.slice(0, 26)}…`
                    : m.name,
                value: by === "monthTurnover" ? m.monthTurnover : m.txCount,
                full: m,
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
                  by === "monthTurnover"
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
                      by === "monthTurnover"
                        ? compactCurrencyFormatter
                        : (v: number) => formatNumber(v, { maximumFractionDigits: 0 })
                    }
                  />
                }
              />
              <Bar
                dataKey="value"
                fill="#3B82F6"
                radius={[0, 6, 6, 0]}
                onClick={(entry) => {
                  const m = (entry as { full?: Merchant }).full;
                  if (m) setSelected(m);
                }}
                style={{ cursor: "pointer" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="flex h-[480px] min-h-0 flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("dashboard.psp.revenueLeaders")}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.psp.revenueLeadersDesc")}
            </p>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            {topRevenue3.map((m, i) => (
              <div
                key={m.id}
                className="rounded-lg border border-border/80 bg-muted/20 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-bold text-primary">#{i + 1}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    ID {m.id}
                  </span>
                </div>
                <div className="mt-1 line-clamp-2 font-medium leading-snug">
                  {m.name}
                </div>
                <div className="mt-1.5 text-sm font-semibold tabular-nums text-foreground">
                  {formatCurrency(m.monthTurnover, "TRY", { maximumFractionDigits: 0 })}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t("dashboard.psp.revenueItemSub", {
                    tx: formatNumber(m.txCount, { maximumFractionDigits: 0 }),
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <ChartCard
        title={t("dashboard.psp.monthlyTrend")}
        description={t("dashboard.psp.monthlyTrendDesc")}
        contentClassName="h-[280px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ left: -14, right: 8, top: 8 }}>
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={compactCurrencyFormatter}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip valueFormatter={compactCurrencyFormatter} />}
            />
            <Line
              type="monotone"
              dataKey="psp"
              name={t("dashboard.psp.linePspTurnover")}
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#3B82F6" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <OwnProductDetailSheet
        productId={ownProduct}
        open={ownProduct !== null}
        onOpenChange={(o) => !o && setOwnProduct(null)}
      />

      <MerchantDetailSheet
        open={Boolean(selected)}
        onOpenChange={(o) => !o && setSelected(null)}
        merchant={selected}
      />
    </div>
  );
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

function daysInclusiveSheet(a: Date, b: Date): number {
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  if (end < start) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

function OwnProductDetailSheet({
  productId,
  open,
  onOpenChange,
}: {
  productId: OwnProductId | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
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
    if (!open || !productId) return;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    setToInput(toInputDate(end));
    setFromInput(toInputDate(start));
  }, [open, productId]);

  const trend = React.useMemo(
    () => (productId ? ownProductMonthlyTrend(productId) : []),
    [productId]
  );
  const snap = React.useMemo(
    () => (productId ? ownProductSnapshot(productId) : null),
    [productId]
  );
  const cashCard = React.useMemo(
    () => (productId ? ownProductCashCardAmounts(productId) : null),
    [productId]
  );

  const rangeStart = parseInputDate(fromInput);
  const rangeEnd = parseInputDate(toInput);
  const rangeOk = Boolean(rangeStart && rangeEnd && rangeStart <= rangeEnd);
  const spanDays =
    rangeOk && rangeStart && rangeEnd
      ? daysInclusiveSheet(rangeStart, rangeEnd)
      : 0;
  const rangeCapped =
    rangeOk && spanDays > OWN_PRODUCT_DAILY_CHART_MAX_DAYS;
  const dailySeries =
    rangeOk && productId && rangeStart && rangeEnd
      ? ownProductDailyCashCardSeries(productId, rangeStart, rangeEnd)
      : [];

  function applyPresetDayCount(n: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (n - 1));
    setToInput(toInputDate(end));
    setFromInput(toInputDate(start));
  }

  if (!productId) return null;

  const cashPct = cashCard?.cashPct ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex max-h-[90vh] w-full flex-col overflow-y-auto sm:max-w-xl">
        <SheetHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2 text-primary">
            <ShoppingBag className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t("dashboard.psp.ownProductBadge")}
            </span>
          </div>
          <SheetTitle>{t(OWN_TITLE[productId])}</SheetTitle>
          <SheetDescription>{t(OWN_SUB[productId])}</SheetDescription>
        </SheetHeader>

        {snap ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border p-3">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {t("dashboard.psp.kpiMonth")}
              </div>
              <div className="mt-1 text-lg font-semibold tabular-nums">
                {formatCurrency(snap.monthAmount, "TRY", { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {t("dashboard.psp.colTxCount")}
              </div>
              <div className="mt-1 text-lg font-semibold tabular-nums">
                {formatNumber(snap.monthTx, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("dashboard.psp.own.sheetTrendTitle")}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t("dashboard.psp.own.sheetTrendDesc")}
          </p>
        </div>
        <div className="mt-2 h-[220px] w-full min-h-0 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={compactCurrencyFormatter}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                content={<ChartTooltip valueFormatter={compactCurrencyFormatter} />}
              />
              <Line
                type="monotone"
                dataKey="amount"
                name={t("dashboard.psp.own.lineAmount")}
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 3, fill: "#3B82F6" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 rounded-lg border border-border p-3">
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

        <div className="mt-4 rounded-lg border border-border p-3">
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
                htmlFor="own-chart-from"
                className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                {t("dashboard.mps.sheetRangeFrom")}
              </label>
              <Input
                id="own-chart-from"
                type="date"
                value={fromInput}
                onChange={(e) => setFromInput(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="own-chart-to"
                className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                {t("dashboard.mps.sheetRangeTo")}
              </label>
              <Input
                id="own-chart-to"
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
              {t("dashboard.mps.sheetRangeCapped", {
                n: OWN_PRODUCT_DAILY_CHART_MAX_DAYS,
              })}
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
                  interval={
                    dailySeries.length > 18
                      ? Math.floor(dailySeries.length / 10)
                      : 0
                  }
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
      </SheetContent>
    </Sheet>
  );
}

function MerchantDetailSheet({
  open,
  onOpenChange,
  merchant,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  merchant: Merchant | null;
}) {
  const { t } = useI18n();
  if (!merchant) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-info/15 text-info">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div>
              <SheetTitle className="flex items-center gap-2">
                {merchant.name}
                <StatusBadge
                  tone={merchant.status === "Active" ? "success" : "muted"}
                >
                  {merchantStatusLabel(merchant.status, t)}
                </StatusBadge>
              </SheetTitle>
              <SheetDescription>
                {t("dashboard.psp.merchantIdDesc", { id: merchant.id })}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <InfoCard
              label={t("dashboard.psp.infoRegistered")}
              value={merchant.registered}
            />
            <InfoCard label={t("dashboard.psp.infoPhone")} value={merchant.phone} />
            <InfoCard
              label={t("dashboard.psp.infoWebsite")}
              value={merchant.website.replace(/^www\./, "")}
            />
            <InfoCard
              label={t("dashboard.psp.colMerchantId")}
              value={String(merchant.id)}
            />
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("common.performance")}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Metric
                label={t("dashboard.psp.metricToday")}
                value={formatCurrency(merchant.todayTurnover, "TRY", {
                  maximumFractionDigits: 0,
                })}
                tone="info"
              />
              <Metric
                label={t("dashboard.psp.metricThisMonth")}
                value={formatCurrency(merchant.monthTurnover, "TRY", {
                  maximumFractionDigits: 0,
                })}
                tone="brand"
              />
              <Metric
                label={t("dashboard.psp.metricTransactions")}
                value={formatNumber(merchant.txCount)}
                tone="default"
              />
              <Metric
                label={t("dashboard.psp.metricAvgTicket")}
                value={
                  merchant.txCount > 0
                    ? formatCurrency(
                        merchant.monthTurnover / merchant.txCount,
                        "TRY",
                        { maximumFractionDigits: 0 }
                      )
                    : "—"
                }
                tone="default"
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "brand" | "info";
}) {
  const toneClass: Record<string, string> = {
    default: "border-border bg-background",
    brand: "border-primary/30 bg-primary/5",
    info: "border-info/30 bg-info/5",
  };
  return (
    <div className={cn("rounded-lg border p-3", toneClass[tone])}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}
