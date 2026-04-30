"use client";

import * as React from "react";
import Link from "next/link";
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
import { ArrowLeft, Building2, MonitorSmartphone, Smartphone, TrendingUp } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ChartCard } from "@/components/dashboard/chart-card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SegmentToggle } from "@/components/dashboard/segment-toggle";
import {
  ChartTooltip,
  compactCurrencyFormatter,
} from "@/components/dashboard/chart-tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type PresetId } from "@/components/dashboard/date-range-picker";
import {
  PAYPOINT_DASHBOARD_GROUP_IDS,
  payPointChannelLabelKey,
  payPointDashboardGroupLabelKey,
  payPointServiceCategoryLabelKey,
} from "@/lib/dashboard-paypoint-cyprus-labels";
import { ownProductMonthlyTrend } from "@/lib/data/psp-own-products";
import {
  type PayPointDashboardGroup,
  PAYPOINT_MUNICIPALITY_PARTNERS,
  payPointCyprusChannelSplit,
  payPointCyprusMomPct,
  payPointCyprusMonthTx,
  payPointCyprusServiceRanking,
  payPointCyprusTotalMonthAmount,
} from "@/lib/data/paypoint-cyprus";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, formatNumber } from "@/lib/utils";

const PAYPOINT_PRODUCT_ID = "paypointCyprus" as const;

/** Overview table rows — full directory on `/paypoint-cyprus/services`. */
const PREVIEW_SERVICE_ROWS = 10;

/** Y-axis: partner · service (truncated for layout). */
const CHART_AXIS_LABEL_MAX = 46;

function compactPayPointChartLabel(partnerName: string, serviceLabel: string): string {
  const sep = " · ";
  const shortPartner =
    partnerName.length > 24 ? `${partnerName.slice(0, 22)}…` : partnerName;
  const shortSvc =
    serviceLabel.length > 18 ? `${serviceLabel.slice(0, 16)}…` : serviceLabel;
  const combined = `${shortPartner}${sep}${shortSvc}`;
  return combined.length <= CHART_AXIS_LABEL_MAX
    ? combined
    : `${combined.slice(0, CHART_AXIS_LABEL_MAX - 1)}…`;
}

export default function PayPointCyprusPage() {
  const { t } = useI18n();
  const [preset, setPreset] = React.useState<PresetId>("month");
  const [, setNonce] = React.useState(0);
  const [group, setGroup] = React.useState<PayPointDashboardGroup>("all");
  const [muniId, setMuniId] = React.useState<string>("");
  const [topBy, setTopBy] = React.useState<"amount" | "txCount">("amount");

  React.useEffect(() => {
    if (group !== "all" && group !== "municipalities") {
      setMuniId("");
    }
  }, [group]);

  const channel = React.useMemo(() => payPointCyprusChannelSplit(), []);
  const monthAmount = payPointCyprusTotalMonthAmount();
  const monthTx = payPointCyprusMonthTx();
  const momPct = payPointCyprusMomPct();

  const monthlyTrend = React.useMemo(
    () => ownProductMonthlyTrend(PAYPOINT_PRODUCT_ID),
    []
  );

  const ranking = React.useMemo(
    () =>
      payPointCyprusServiceRanking(500, {
        group,
        partnerId: muniId || undefined,
      }),
    [group, muniId]
  );

  const sortedRanking = React.useMemo(() => {
    const rows = [...ranking];
    rows.sort((a, b) =>
      topBy === "amount" ? b.amount - a.amount : b.txCount - a.txCount
    );
    return rows;
  }, [ranking, topBy]);

  const sumTxInView = sortedRanking.reduce((s, r) => s + r.txCount, 0);

  const chartData = React.useMemo(
    () =>
      sortedRanking.slice(0, 18).map((r) => ({
        label: compactPayPointChartLabel(r.partner.name, r.service.label),
        partnerName: r.partner.name,
        serviceLabel: r.service.label,
        value: topBy === "amount" ? r.amount : r.txCount,
      })),
    [sortedRanking, topBy]
  );

  const chartTickFormatter =
    topBy === "amount"
      ? compactCurrencyFormatter
      : (v: number) => formatNumber(v, { maximumFractionDigits: 0 });

  const previewRows = sortedRanking.slice(0, PREVIEW_SERVICE_ROWS);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={t("dashboard.psp.ppCy.title")}
        subtitle={t("dashboard.psp.ppCy.subtitle")}
        preset={preset}
        onPresetChange={setPreset}
        onRefresh={() => setNonce((n) => n + 1)}
        trailing={
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href="/dashboard/psp">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("subnav.pspOverview")}
            </Link>
          </Button>
        }
      />

      <p className="text-[11px] text-muted-foreground">{t("dashboard.psp.ppCy.demoDisclaimer")}</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label={t("dashboard.psp.ppCy.kpiMonth")}
          value={monthAmount}
          format={(v) => formatCurrency(v, "TRY", { maximumFractionDigits: 0 })}
          icon={TrendingUp}
          tone="brand"
        />
        <KpiCard
          label={t("dashboard.psp.ppCy.kpiTx")}
          value={monthTx}
          format={(v) => formatNumber(v, { maximumFractionDigits: 0 })}
          icon={Building2}
          tone="info"
        />
        <KpiCard
          label={t("dashboard.psp.ppCy.kpiKiosk")}
          value={channel.kiosk}
          format={(v) => formatCurrency(v, "TRY", { maximumFractionDigits: 0 })}
          icon={MonitorSmartphone}
          sub={`${channel.kioskPct.toFixed(1)}%`}
          tone="warning"
        />
        <KpiCard
          label={t("dashboard.psp.ppCy.kpiWebMobile")}
          value={channel.webMobile}
          format={(v) => formatCurrency(v, "TRY", { maximumFractionDigits: 0 })}
          icon={Smartphone}
          sub={`${(100 - channel.kioskPct).toFixed(1)}%`}
          tone="success"
        />
        <KpiCard
          label={t("dashboard.psp.ppCy.kpiMom")}
          value={momPct}
          format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
          icon={TrendingUp}
          sub={t("dashboard.psp.subLast30")}
          tone={momPct >= 0 ? "success" : "danger"}
        />
      </div>

      <ChartCard
        title={t("dashboard.psp.own.sheetTrendTitle")}
        description={t("dashboard.psp.own.sheetTrendDesc")}
        contentClassName="h-[260px] min-h-0"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyTrend} margin={{ left: -14, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" />
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
            <Tooltip content={<ChartTooltip valueFormatter={compactCurrencyFormatter} />} />
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
      </ChartCard>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("dashboard.psp.ppCy.channelSplitTitle")}</CardTitle>
          <CardDescription>{t("dashboard.psp.ppCy.channelSplitSub")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-amber-500" style={{ width: `${channel.kioskPct}%` }} />
            <div
              className="h-full bg-blue-500"
              style={{ width: `${Math.max(0, 100 - channel.kioskPct)}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-muted-foreground">
            <span className="tabular-nums">
              {t("dashboard.psp.ppCy.chan.kiosk")}:{" "}
              {formatCurrency(channel.kiosk, "TRY", { maximumFractionDigits: 0 })}
            </span>
            <span className="tabular-nums">
              {t("dashboard.psp.ppCy.chan.webMobile")}:{" "}
              {formatCurrency(channel.webMobile, "TRY", { maximumFractionDigits: 0 })}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3 pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-sm">{t("dashboard.psp.ppCy.groupLabel")}</CardTitle>
              <p className="text-xs text-muted-foreground">{t("dashboard.psp.ppCy.groupCardDesc")}</p>
            </div>
            <Select
              value={group}
              onValueChange={(v) => setGroup(v as PayPointDashboardGroup)}
            >
              <SelectTrigger className="h-9 w-full max-w-xs text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYPOINT_DASHBOARD_GROUP_IDS.map((id) => (
                  <SelectItem key={id} value={id}>
                    {t(payPointDashboardGroupLabelKey(id))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(group === "all" || group === "municipalities") && (
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs">{t("dashboard.psp.ppCy.muniSection")}</Label>
              <p className="text-[11px] text-muted-foreground">{t("dashboard.psp.ppCy.muniHint")}</p>
              <Select value={muniId || "__all__"} onValueChange={(v) => setMuniId(v === "__all__" ? "" : v)}>
                <SelectTrigger className="h-9 max-w-md text-xs">
                  <SelectValue placeholder={t("dashboard.psp.ppCy.muniAll")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t("dashboard.psp.ppCy.muniAll")}</SelectItem>
                  {PAYPOINT_MUNICIPALITY_PARTNERS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={t("dashboard.psp.ppCy.chartTitle")}
          description={
            topBy === "amount"
              ? t("dashboard.psp.ppCy.chartDescRev")
              : t("dashboard.psp.ppCy.chartDescCount")
          }
          actions={
            <SegmentToggle
              value={topBy}
              onChange={(v) => setTopBy(v)}
              options={[
                { id: "amount", label: t("common.revenue") },
                { id: "txCount", label: t("common.count") },
              ]}
            />
          }
          contentClassName="h-[420px] min-h-0"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
            >
              <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={chartTickFormatter}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={168}
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as
                    | {
                        partnerName?: string;
                        serviceLabel?: string;
                      }
                    | undefined;
                  const title =
                    row?.partnerName && row?.serviceLabel
                      ? `${row.partnerName} · ${row.serviceLabel}`
                      : undefined;
                  return (
                    <ChartTooltip
                      active={active}
                      payload={
                        payload as
                          | {
                              name?: string;
                              value?: number;
                              color?: string;
                              dataKey?: string;
                              payload?: Record<string, unknown>;
                            }[]
                          | undefined
                      }
                      label={title}
                      valueFormatter={
                        topBy === "amount"
                          ? compactCurrencyFormatter
                          : (v: number) => formatNumber(v, { maximumFractionDigits: 0 })
                      }
                    />
                  );
                }}
              />
              <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="flex min-h-[420px] flex-col">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-sm">{t("dashboard.psp.ppCy.tableTitle")}</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              {t("dashboard.psp.ppCy.servicesPreviewSub", {
                n: PREVIEW_SERVICE_ROWS,
                total: sortedRanking.length,
              })}
            </p>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-2 font-medium">{t("dashboard.psp.ppCy.colService")}</th>
                  <th className="pb-2 pr-2 font-medium">{t("dashboard.psp.ppCy.colPartner")}</th>
                  <th className="pb-2 pr-2 font-medium">{t("dashboard.psp.ppCy.colCategory")}</th>
                  <th className="pb-2 pr-2 font-medium">{t("dashboard.psp.ppCy.colChannel")}</th>
                  <th className="pb-2 pr-2 text-right font-medium">{t("dashboard.psp.ppCy.colAmount")}</th>
                  <th className="pb-2 pr-2 text-right font-medium">{t("dashboard.psp.ppCy.colShare")}</th>
                  <th className="pb-2 text-right font-medium">{t("dashboard.psp.ppCy.colTx")}</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r) => {
                  const sharePct =
                    topBy === "amount"
                      ? r.sharePct
                      : sumTxInView > 0
                        ? (r.txCount / sumTxInView) * 100
                        : 0;
                  return (
                    <tr key={r.service.id} className="border-b border-border/60 hover:bg-muted/30">
                      <td className="py-1.5 pr-2 align-top font-medium">{r.service.label}</td>
                      <td className="py-1.5 pr-2 align-top text-muted-foreground">{r.partner.name}</td>
                      <td className="py-1.5 pr-2 align-top">
                        {t(payPointServiceCategoryLabelKey(r.service.category))}
                      </td>
                      <td className="py-1.5 pr-2 align-top">
                        {t(payPointChannelLabelKey(r.service.channels))}
                      </td>
                      <td className="py-1.5 pr-2 text-right tabular-nums">
                        {formatCurrency(r.amount, "TRY", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-1.5 pr-2 text-right tabular-nums">{sharePct.toFixed(1)}%</td>
                      <td className="py-1.5 text-right tabular-nums">{r.txCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Button variant="outline" size="sm" className="shrink-0 self-start" asChild>
              <Link href="/dashboard/psp/paypoint-cyprus/services">{t("dashboard.psp.ppCy.viewAllServices")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
