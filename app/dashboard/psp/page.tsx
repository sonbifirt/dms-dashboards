"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  CheckCircle2,
  ExternalLink,
  Gauge,
  Globe,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { SegmentToggle } from "@/components/dashboard/segment-toggle";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type PresetId } from "@/components/dashboard/date-range-picker";
import {
  KPI,
  MERCHANT_MONTH_TURNOVER,
  hourlyHeatmap,
  monthlyTurnoverSeries,
  topMerchants,
} from "@/lib/aggregations";
import { merchants } from "@/lib/data/merchants";
import type { Merchant } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { HEATMAP_DAY_LABEL } from "@/lib/i18n/calendar-days";
import { merchantStatusLabel } from "@/lib/i18n/merchant-status";

export default function PspDashboardPage() {
  const { t } = useI18n();
  const [preset, setPreset] = React.useState<PresetId>("month");
  const [, setNonce] = React.useState(0);
  const [by, setBy] = React.useState<"monthTurnover" | "txCount">("monthTurnover");
  const [selected, setSelected] = React.useState<Merchant | null>(null);

  const top = topMerchants(25, by);
  const trend = monthlyTurnoverSeries(12);
  const topRevenue3 = React.useMemo(
    () => [...merchants].sort((a, b) => b.monthTurnover - a.monthTurnover).slice(0, 3),
    []
  );
  const heatmap = hourlyHeatmap();
  const maxHeat = React.useMemo(
    () => Math.max(...heatmap.map((c) => c.value)),
    [heatmap]
  );

  const activeMerchants = merchants.filter((m) => m.status === "Active").length;
  const avgTicket = React.useMemo(() => {
    const total = merchants.reduce((a, m) => a + m.monthTurnover, 0);
    const tx = merchants.reduce((a, m) => a + m.txCount, 0);
    return tx > 0 ? total / tx : 0;
  }, []);

  const columns: Column<Merchant>[] = React.useMemo(
    () => [
    {
      key: "id",
      header: t("dashboard.psp.colMerchantId"),
      sortable: true,
      width: "88px",
      format: (r) => (
        <span className="font-mono text-xs tabular-nums">{r.id}</span>
      ),
    },
    { key: "name", header: t("dashboard.psp.colMerchant"), sortable: true },
    {
      key: "website",
      header: t("dashboard.psp.colWebsite"),
      format: (r) => (
        <a
          href={
            r.website.startsWith("http")
              ? r.website
              : `https://${r.website.replace(/^www\./, "")}`
          }
          onClick={(e) => e.stopPropagation()}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <Globe className="h-3 w-3" />
          <span className="truncate">{r.website.replace(/^www\./, "")}</span>
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
      ),
    },
    { key: "registered", header: t("dashboard.psp.colRegistered"), sortable: true },
    {
      key: "status",
      header: t("common.status"),
      format: (r) => (
        <StatusBadge tone={r.status === "Active" ? "success" : "muted"}>
          {merchantStatusLabel(r.status, t)}
        </StatusBadge>
      ),
    },
    {
      key: "txCount",
      header: t("dashboard.psp.colTxCount"),
      align: "right",
      sortable: true,
      format: (r) => formatNumber(r.txCount, { maximumFractionDigits: 0 }),
    },
    {
      key: "monthTurnover",
      header: t("dashboard.psp.colMonthTurnover"),
      align: "right",
      sortable: true,
      format: (r) => (
        <span className="font-semibold">
          {formatCurrency(r.monthTurnover, "TRY", { maximumFractionDigits: 0 })}
        </span>
      ),
    },
  ],
    [t]
  );

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
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
                content={
                  <ChartTooltip valueFormatter={compactCurrencyFormatter} />
                }
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> {t("dashboard.psp.recentSignups")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...merchants]
              .sort(
                (a, b) =>
                  new Date(b.registered).getTime() - new Date(a.registered).getTime()
              )
              .slice(0, 6)
              .map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary font-semibold">
                    {m.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{m.name}</div>
                    <div className="text-muted-foreground">
                      ID {m.id} · {m.registered}
                    </div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t("dashboard.psp.heatmap")}</CardTitle>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {t("dashboard.psp.heatmapSub")}
          </div>
        </CardHeader>
        <CardContent>
          <div className="scrollbar-thin overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="grid grid-cols-[28px_repeat(24,1fr)] gap-0.5 text-[10px] text-muted-foreground">
                <span />
                {Array.from({ length: 24 }, (_, h) => (
                  <span key={h} className="py-0.5 text-center">
                    {h.toString().padStart(2, "0")}
                  </span>
                ))}
              </div>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div
                  key={day}
                  className="mt-0.5 grid grid-cols-[28px_repeat(24,1fr)] gap-0.5"
                >
                  <span className="self-center text-right text-[10px] font-medium text-muted-foreground pr-1">
                    {t(HEATMAP_DAY_LABEL[day] ?? "calendar.mon")}
                  </span>
                  {heatmap
                    .filter((c) => c.day === day)
                    .map((c) => {
                      const intensity = c.value / maxHeat;
                      return (
                        <div
                          key={`${c.day}-${c.hour}`}
                          className="group relative h-6 rounded-sm"
                          style={{
                            backgroundColor: `rgba(231, 76, 60, ${0.06 + intensity * 0.9})`,
                          }}
                          title={t("dashboard.psp.heatmapTitleFmt", {
                            day: t(HEATMAP_DAY_LABEL[c.day] ?? "calendar.mon"),
                            hour: c.hour,
                            n: formatNumber(c.value),
                          })}
                        />
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>{t("common.less")}</span>
            <div className="flex gap-0.5">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
                <span
                  key={v}
                  className="h-2 w-4 rounded-sm"
                  style={{ backgroundColor: `rgba(231, 76, 60, ${v})` }}
                />
              ))}
            </div>
            <span>{t("common.more")}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm">{t("dashboard.psp.merchantsDir")}</CardTitle>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {t("dashboard.psp.merchantsDirSub", { n: merchants.length })}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<Merchant>
            rows={merchants}
            columns={columns}
            rowKey={(m) => m.id}
            onRowClick={setSelected}
            searchKeys={["name", "website"]}
            searchPlaceholder={t("dashboard.psp.searchMerchants")}
            pageSize={10}
            initialSort={{ key: "monthTurnover", dir: "desc" }}
            exportName="merchants.csv"
            filters={[
              {
                id: "status",
                label: t("common.status"),
                options: [
                  { value: "Active", label: t("common.merchantStatusActive") },
                  { value: "Inactive", label: t("common.merchantStatusInactive") },
                ],
                predicate: (m, v) => m.status === v,
              },
            ]}
          />
        </CardContent>
      </Card>

      <MerchantDetailSheet
        open={Boolean(selected)}
        onOpenChange={(o) => !o && setSelected(null)}
        merchant={selected}
      />
    </div>
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
