"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Building2,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Users,
  Wallet,
  Eye,
} from "lucide-react";

import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { type PresetId } from "@/components/dashboard/date-range-picker";
import { SegmentToggle } from "@/components/dashboard/segment-toggle";
import {
  KPI,
  dealerLocationBreakdown,
  dealerStatusBreakdown,
  kioskGroupedByDealer,
} from "@/lib/aggregations";
import { dealers } from "@/lib/data/dealers";
import { kiosks } from "@/lib/data/kiosks";
import type { Dealer } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { merchantStatusLabel } from "@/lib/i18n/merchant-status";
import { translateKioskStatus } from "@/lib/i18n/kiosk-status";

function dealerKioskStats(dealerId: number) {
  const ks = kiosks.filter((k) => k.dealerId === dealerId);
  const turnover = ks.reduce((a, k) => a + k.totalAmount, 0);
  const tx = ks.reduce((a, k) => a + k.totalCount, 0);
  return { count: ks.length, turnover, tx };
}

export default function DealersDashboardPage() {
  const { t } = useI18n();
  const [preset, setPreset] = React.useState<PresetId>("month");
  const [, setNonce] = React.useState(0);
  const [selected, setSelected] = React.useState<Dealer | null>(null);
  const [barBy, setBarBy] = React.useState<"turnover" | "tx">("turnover");

  const statusBreak = dealerStatusBreakdown();
  const locBreak = dealerLocationBreakdown(8);
  const topMps = kioskGroupedByDealer().slice(0, 12);
  const byKioskCount = kioskGroupedByDealer()
    .sort((a, b) => b.kioskCount - a.kioskCount)
    .slice(0, 6);
  const mpsCoveredKiosks = kiosks.filter((k) => k.dealerId).length;

  const inactiveCount = dealers.filter((d) => d.status === "Inactive").length;

  const columns: Column<Dealer>[] = React.useMemo(
    () => [
    { key: "id", header: t("dashboard.dealers.colId"), sortable: true, width: "60px" },
    { key: "name", header: t("dashboard.dealers.colName"), sortable: true },
    { key: "location", header: t("dashboard.dealers.colLocation"), sortable: true },
    {
      key: "email",
      header: t("dashboard.dealers.colEmail"),
      format: (r) => (
        <a
          href={`mailto:${r.email}`}
          onClick={(e) => e.stopPropagation()}
          className="text-primary hover:underline"
        >
          {r.email}
        </a>
      ),
    },
    { key: "phone", header: t("dashboard.dealers.colPhone") },
    {
      key: "id",
      header: t("dashboard.dealers.colDmsKiosks"),
      align: "right",
      sortable: true,
      accessor: (r) => dealerKioskStats(r.id).count,
      format: (r) => (
        <span className="tabular-nums">{dealerKioskStats(r.id).count}</span>
      ),
    },
    {
      key: "balance",
      header: t("dashboard.dealers.colDmsTurnover"),
      align: "right",
      sortable: true,
      accessor: (r) => dealerKioskStats(r.id).turnover,
      format: (r) => (
        <span className="font-medium tabular-nums">
          {formatCurrency(dealerKioskStats(r.id).turnover, "TRY", {
            maximumFractionDigits: 0,
          })}
        </span>
      ),
    },
    {
      key: "status",
      header: t("dashboard.dealers.colStatus"),
      format: (r) => (
        <StatusBadge tone={r.status === "Active" ? "success" : "muted"}>
          {merchantStatusLabel(r.status, t)}
        </StatusBadge>
      ),
    },
    {
      key: "id" as const,
      header: "",
      width: "40px",
      align: "right",
      format: (r) => <ActionsMenu dealer={r} />,
    },
  ],
    [t]
  );

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={t("dashboard.dealers.title")}
        subtitle={t("dashboard.dealers.subtitle")}
        preset={preset}
        onPresetChange={setPreset}
        onRefresh={() => setNonce((n) => n + 1)}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          label={t("dashboard.dealers.kpiTotal")}
          value={KPI.totalDealers}
          icon={Building2}
          sub={t("dashboard.dealers.subActiveInactive", {
            active: KPI.activeDealers,
            inactive: inactiveCount,
          })}
          tone="brand"
        />
        <KpiCard
          label={t("dashboard.dealers.kpiActive")}
          value={KPI.activeDealers}
          icon={Users}
          sub={t("dashboard.dealers.subPct", {
            pct: ((KPI.activeDealers / KPI.totalDealers) * 100).toFixed(1),
          })}
          tone="success"
          delta={{ value: 2.5, label: t("common.mom") }}
        />
        <KpiCard
          label={t("dashboard.dealers.kpiKiosksWDealer")}
          value={mpsCoveredKiosks}
          sub={t("dashboard.dealers.subKiosksTotal", { n: KPI.totalKiosks })}
          icon={MapPin}
          tone="info"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title={t("dashboard.dealers.topDealersTitle")}
          description={t("dashboard.dealers.topDealersDesc")}
          contentClassName="h-[360px] min-h-0"
          actions={
            <SegmentToggle
              value={barBy}
              onChange={setBarBy}
              options={[
                { id: "turnover", label: t("common.revenue") },
                { id: "tx", label: t("common.transactions") },
              ]}
            />
          }
        >
          <div className="h-[360px] w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={topMps.map((d, i) => {
                const short =
                  d.dealerName.length > 18
                    ? d.dealerName.slice(0, 16) + "…"
                    : d.dealerName;
                return {
                  label: `${i + 1}. ${short} (#${d.dealerId})`,
                  value: barBy === "turnover" ? d.turnover : d.tx,
                };
              })}
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
                tickFormatter={
                  barBy === "turnover"
                    ? compactCurrencyFormatter
                    : (v: number) => formatNumber(v, { maximumFractionDigits: 0 })
                }
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={200}
                tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    valueFormatter={
                      barBy === "turnover"
                        ? compactCurrencyFormatter
                        : (v) => formatNumber(v, { maximumFractionDigits: 0 })
                    }
                    suffix={barBy === "tx" ? ` ${t("common.tx")}` : ""}
                  />
                }
              />
              <Bar dataKey="value" fill="#E74C3C" radius={[0, 6, 6, 0]} />
            </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="grid h-auto min-h-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <ChartCard
            title={t("dashboard.dealers.statusTitle")}
            description={t("dashboard.dealers.statusDesc")}
            contentClassName="flex h-[200px] min-h-0 flex-col !p-0 !pt-0"
          >
            <div className="h-[120px] min-h-0 w-full px-3 pt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreak}
                    innerRadius={32}
                    outerRadius={50}
                    dataKey="value"
                    nameKey="name"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#94A3B8" />
                  </Pie>
                  <Tooltip content={<ChartTooltip suffix={t("dashboard.dealers.suffixDealers")} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-auto flex items-center justify-center gap-3 px-2 pb-2 text-[11px]">
              <Legend
                color="#10B981"
                label={t("dashboard.dealers.legendActive", { n: statusBreak[0].value })}
              />
              <Legend
                color="#94A3B8"
                label={t("dashboard.dealers.legendInactive", { n: statusBreak[1].value })}
              />
            </div>
          </ChartCard>

          <ChartCard
            title={t("dashboard.dealers.kiosksByDealer")}
            description={t("dashboard.dealers.kiosksByDealerDesc")}
            contentClassName="flex h-[200px] min-h-0 flex-col !p-0 !pt-0"
          >
            <div className="h-[200px] min-h-0 w-full px-2 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={byKioskCount.map((d, i) => {
                    const short =
                      d.dealerName.length > 20
                        ? d.dealerName.slice(0, 18) + "…"
                        : d.dealerName;
                    return {
                      label: `${i + 1}. ${short} (#${d.dealerId})`,
                      count: d.kioskCount,
                    };
                  })}
                  margin={{ top: 2, right: 8, left: 2, bottom: 2 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={190}
                    tick={{ fontSize: 8 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        valueFormatter={(v) => String(v)}
                        suffix={` ${t("dashboard.psp.suffixKiosks")}`}
                      />
                    }
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} name={t("dashboard.dealers.barNameKiosks")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>

      <ChartCard
        title={t("dashboard.dealers.byLocation")}
        description={t("dashboard.dealers.byLocationDesc")}
        contentClassName="h-[300px] min-h-0"
      >
        <div className="h-[300px] w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={locBreak} margin={{ left: 8, right: 8, top: 8, bottom: 4 }}>
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={56}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltip suffix={t("dashboard.dealers.suffixDealers")} />} />
            <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
          </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm">{t("dashboard.dealers.allDealersTitle")}</CardTitle>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {t("dashboard.dealers.allDealersSub", { n: dealers.length })}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<Dealer>
            rows={dealers}
            columns={columns}
            rowKey={(d) => d.id}
            onRowClick={setSelected}
            searchKeys={["name", "location", "email", "phone"]}
            searchPlaceholder={t("dashboard.dealers.search")}
            pageSize={10}
            initialSort={{ key: "balance", dir: "desc" }}
            exportName="dealers.csv"
            filters={[
              {
                id: "status",
                label: t("common.status"),
                options: [
                  { value: "Active", label: t("common.merchantStatusActive") },
                  { value: "Inactive", label: t("common.merchantStatusInactive") },
                ],
                predicate: (d, v) => d.status === v,
              },
            ]}
          />
        </CardContent>
      </Card>

      <DealerDetailSheet
        open={Boolean(selected)}
        onOpenChange={(o) => !o && setSelected(null)}
        dealer={selected}
      />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function ActionsMenu({ dealer }: { dealer: Dealer }) {
  const { toast } = useToast();
  const { t } = useI18n();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem>
          <Eye className="mr-2 h-4 w-4" /> {t("dashboard.dealers.actionsView")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            toast({
              title: t("dashboard.dealers.toastTopUpTitle"),
              description: t("dashboard.dealers.toastTopUpDesc", { name: dealer.name }),
              variant: "success",
            });
          }}
        >
          <Wallet className="mr-2 h-4 w-4" /> {t("dashboard.dealers.actionsTopUp")}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Mail className="mr-2 h-4 w-4" /> {t("dashboard.dealers.actionsSendEmail")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DealerDetailSheet({
  open,
  onOpenChange,
  dealer,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  dealer: Dealer | null;
}) {
  const { t } = useI18n();
  if (!dealer) return null;
  const dealerKiosks = kiosks.filter((k) => k.dealerId === dealer.id);
  const kioskRevenue = dealerKiosks.reduce((a, k) => a + k.totalAmount, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <SheetTitle className="flex flex-wrap items-center gap-2">
                {dealer.name}
                <StatusBadge
                  tone={dealer.status === "Active" ? "success" : "muted"}
                >
                  {merchantStatusLabel(dealer.status, t)}
                </StatusBadge>
                <StatusBadge
                  tone={dealer.workMode === "Production" ? "info" : "warning"}
                >
                  {dealer.workMode}
                </StatusBadge>
              </SheetTitle>
              <SheetDescription>
                {t("dashboard.dealers.sheetDealerId", { id: dealer.id })}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label={t("dashboard.dealers.infoLocation")} value={dealer.location} />
            <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label={t("dashboard.dealers.infoPhone")} value={dealer.phone} />
            <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label={t("dashboard.dealers.infoEmail")} value={dealer.email} />
            <InfoRow
              icon={<Building2 className="h-3.5 w-3.5" />}
              label={t("dashboard.dealers.infoKiosks")}
              value={`${dealerKiosks.length}`}
            />
          </div>

          {dealerKiosks.length > 0 ? (
            <div className="rounded-lg border border-border">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("dashboard.dealers.assignedKiosks")}
                </div>
                <div className="text-xs">
                  {t("dashboard.dealers.totalKioskRev")}{" "}
                  <span className="font-semibold">
                    {formatCurrency(kioskRevenue, "TRY", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>
              <ul className="divide-y divide-border">
                {dealerKiosks.slice(0, 8).map((k) => (
                  <li
                    key={k.id}
                    className="flex items-center gap-3 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {k.id} · {k.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {k.city} · {translateKioskStatus(k.status, t)}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-semibold tabular-nums">
                        {formatCurrency(k.totalAmount, "TRY", {
                          maximumFractionDigits: 0,
                        })}
                      </div>
                      <div className="text-muted-foreground">
                        {formatNumber(k.totalCount)} {t("dashboard.dealers.txCount")}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="gap-1.5">
              <Wallet className="h-3.5 w-3.5" /> {t("dashboard.dealers.btnTopUp")}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {t("dashboard.dealers.btnEmail")}
            </Button>
            <Button size="sm" variant="outline" className={cn("gap-1.5")}>
              {t("dashboard.dealers.btnViewProfile")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({
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
      <div className="mt-0.5 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}
