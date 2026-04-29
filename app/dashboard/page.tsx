"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
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
  Activity,
  CreditCard,
  LineChart as LineChartIcon,
  MonitorSmartphone,
  Wallet,
} from "lucide-react";

import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  ChartTooltip,
  compactCurrencyFormatter,
} from "@/components/dashboard/chart-tooltip";
import { type PresetId } from "@/components/dashboard/date-range-picker";
import {
  KPI,
  TOTAL_TURNOVER,
  kioskStatusBreakdown,
  monthlyTurnoverSeries,
  regionKioskShareByCity,
  segmentSeries,
} from "@/lib/aggregations";
import { useI18n } from "@/lib/i18n";
import { translateKioskStatus } from "@/lib/i18n/kiosk-status";

const REGION_COLORS = [
  "#E74C3C",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#94A3B8",
];

export default function GeneralDashboardPage() {
  const { t } = useI18n();
  const [preset, setPreset] = React.useState<PresetId>("month");
  const [nonce, setNonce] = React.useState(0);
  const [activeKpi, setActiveKpi] = React.useState<string | null>("turnover");

  const monthly = React.useMemo(
    () => monthlyTurnoverSeries(12),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preset, nonce]
  );
  const segment = React.useMemo(
    () => segmentSeries(7),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preset, nonce]
  );
  const statusBreak = kioskStatusBreakdown();
  const regionShare = regionKioskShareByCity(7);

  /** Display-only ~70.4% / 29.6% split for clearer pie balance. */
  const splitData = React.useMemo(() => {
    const base = 1_000_000;
    return [
      { name: t("common.cash"), value: Math.round(base * 0.7037) },
      { name: t("common.card"), value: Math.round(base * 0.2963) },
    ];
  }, [t]);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={t("dashboard.gen.title")}
        subtitle={t("dashboard.gen.subtitle")}
        preset={preset}
        onPresetChange={setPreset}
        onRefresh={() => setNonce((n) => n + 1)}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label={t("dashboard.gen.kpiTotalTurnover")}
          value={KPI.totalTurnover}
          format={(v) => formatCurrency(v, "TRY", { maximumFractionDigits: 0 })}
          icon={Wallet}
          delta={{ value: 8.4, label: t("common.mom") }}
          sub={t("dashboard.gen.subDmsPsp")}
          tone="brand"
          active={activeKpi === "turnover"}
          onClick={() => setActiveKpi("turnover")}
        />
        <KpiCard
          label={t("dashboard.gen.kpiDmsTurnover")}
          value={TOTAL_TURNOVER}
          format={(v) => formatCurrency(v, "TRY", { maximumFractionDigits: 0 })}
          icon={MonitorSmartphone}
          tone="success"
          active={activeKpi === "dms"}
          onClick={() => setActiveKpi("dms")}
        />
        <KpiCard
          label={t("dashboard.gen.kpiPspTurnover")}
          value={KPI.pspMonthTurnover}
          format={(v) => formatCurrency(v, "TRY", { maximumFractionDigits: 0 })}
          icon={CreditCard}
          sub={t("dashboard.gen.subPspTx", {
            n: formatNumber(KPI.pspTx, { maximumFractionDigits: 0 }),
          })}
          delta={{ value: 9.6, label: t("common.mom") }}
          tone="info"
          active={activeKpi === "pspTurnover"}
          onClick={() => setActiveKpi("pspTurnover")}
        />
        <KpiCard
          label={t("dashboard.gen.kpiTotalTx")}
          value={KPI.totalTx}
          format={(v) => formatNumber(v, { maximumFractionDigits: 0 })}
          icon={Activity}
          delta={{ value: 4.7, label: t("common.wow") }}
          sub={t("dashboard.gen.subDmsPspTx", {
            dms: formatNumber(KPI.dmsTx, { maximumFractionDigits: 0 }),
            psp: formatNumber(KPI.pspTx, { maximumFractionDigits: 0 }),
          })}
          tone="info"
          active={activeKpi === "tx"}
          onClick={() => setActiveKpi("tx")}
        />
        <KpiCard
          label={t("dashboard.gen.kpiActiveKiosks")}
          value={KPI.activeKiosks}
          sub={t("dashboard.gen.subOfDeployed", { n: KPI.totalKiosks })}
          icon={MonitorSmartphone}
          delta={{ value: -0.8 }}
          tone="warning"
          active={activeKpi === "kiosks"}
          onClick={() => setActiveKpi("kiosks")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title={t("dashboard.gen.chartMonthlyTitle")}
          description={t("dashboard.gen.chartMonthlyDesc")}
          contentClassName="h-[300px] min-h-0"
        >
          <div className="h-[300px] w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthly} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="dmsGradGen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E74C3C" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#E74C3C" stopOpacity={0.08} />
                </linearGradient>
                <linearGradient id="pspGradGen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.38} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.06} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickMargin={6}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={52}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={compactCurrencyFormatter}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                content={
                  <ChartTooltip valueFormatter={compactCurrencyFormatter} />
                }
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area
                type="monotone"
                dataKey="dms"
                name={t("dashboard.gen.chartLegendDms")}
                stackId="tot"
                stroke="#E74C3C"
                strokeWidth={1.5}
                fill="url(#dmsGradGen)"
              />
              <Area
                type="monotone"
                dataKey="psp"
                name={t("dashboard.gen.chartLegendPsp")}
                stackId="tot"
                stroke="#3B82F6"
                strokeWidth={1.5}
                fill="url(#pspGradGen)"
              />
            </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title={t("dashboard.gen.chartCashCardTitle")}
          contentClassName="min-h-0 h-[300px] flex flex-col"
        >
          <div className="relative h-[200px] w-full min-h-0 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={splitData}
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {splitData.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={i === 0 ? "#F59E0B" : "#3B82F6"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={
                    <ChartTooltip
                      valueFormatter={compactCurrencyFormatter}
                      labelFormatter={(l) => l}
                    />
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto grid flex-1 grid-cols-2 gap-2 text-xs">
            {splitData.map((s, i) => {
              const total = splitData.reduce((acc, x) => acc + x.value, 0);
              const pct = total > 0 ? (s.value / total) * 100 : 0;
              return (
                <div
                  key={s.name}
                  className="rounded-md border border-border p-2"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: i === 0 ? "#F59E0B" : "#3B82F6" }}
                    />
                    <span className="text-muted-foreground">{s.name}</span>
                  </div>
                  <div className="mt-0.5 text-sm font-semibold tabular-nums">
                    {compactCurrencyFormatter(s.value)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {pct.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title={t("dashboard.gen.segmentTitle")}
        description={t("dashboard.gen.segmentDesc")}
        contentClassName="h-[300px] min-h-0"
      >
        <div className="h-[300px] w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={segment}
              margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
              barCategoryGap="18%"
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={52}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={compactCurrencyFormatter}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                content={
                  <ChartTooltip valueFormatter={compactCurrencyFormatter} />
                }
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar
                dataKey="dms"
                fill="#E74C3C"
                name={t("dashboard.gen.barDms")}
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="psp"
                fill="#3B82F6"
                name={t("dashboard.gen.barPsp")}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-semibold">{t("dashboard.gen.regionTitle")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.gen.regionDesc")}
            </p>
          </div>
          <div className="px-4 pb-4">
            <div className="flex h-[300px] min-h-0 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative h-[200px] min-h-0 w-full sm:h-full sm:max-w-[55%]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionShare}
                      innerRadius={48}
                      outerRadius={90}
                      paddingAngle={1.2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {regionShare.map((_, i) => (
                        <Cell
                          key={i}
                          fill={REGION_COLORS[i % REGION_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={compactCurrencyFormatter}
                          labelFormatter={(l) => String(l)}
                        />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="max-h-[140px] flex-1 space-y-1.5 overflow-y-auto text-xs sm:max-h-none">
                {regionShare.map((r, i) => {
                  const sum = regionShare.reduce((a, x) => a + x.value, 0);
                  const pct = sum > 0 ? (r.value / sum) * 100 : 0;
                  return (
                    <li
                      key={r.name}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: REGION_COLORS[i % REGION_COLORS.length],
                          }}
                        />
                        <span className="truncate text-muted-foreground">
                          {r.name}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {pct.toFixed(1)}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <LineChartIcon className="h-4 w-4 text-primary" />{" "}
              {t("dashboard.gen.systemHealth")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusBreak.map((s) => {
              const total = statusBreak.reduce((a, r) => a + r.value, 0);
              const pct = total > 0 ? (s.value / total) * 100 : 0;
              const tone =
                s.name === "OK"
                  ? "success"
                  : s.name === "Paper Warning"
                    ? "warning"
                    : s.name === "Error"
                      ? "danger"
                      : s.name === "Not Found"
                        ? "info"
                        : "muted";
              const toneBg: Record<string, string> = {
                success: "bg-success",
                warning: "bg-warning",
                danger: "bg-destructive",
                info: "bg-info",
                muted: "bg-muted-foreground",
              };
              return (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">
                      {translateKioskStatus(s.name, t)}
                    </span>
                    <span className="text-muted-foreground">
                      {s.value} · {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", toneBg[tone])}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
