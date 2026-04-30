"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SegmentToggle } from "@/components/dashboard/segment-toggle";
import { DataTable, type Column } from "@/components/dashboard/data-table";
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
import {
  type PayPointDashboardGroup,
  PAYPOINT_MUNICIPALITY_PARTNERS,
  payPointCyprusServiceRanking,
} from "@/lib/data/paypoint-cyprus";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, formatNumber } from "@/lib/utils";

type ServiceRow = {
  id: string;
  serviceLabel: string;
  partnerName: string;
  categoryLabel: string;
  channelLabel: string;
  amount: number;
  txCount: number;
  sharePct: number;
};

export default function PayPointCyprusServicesPage() {
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

  const ranking = React.useMemo(
    () =>
      payPointCyprusServiceRanking(2000, {
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

  const rows: ServiceRow[] = React.useMemo(
    () =>
      sortedRanking.map((r) => {
        const sharePct =
          topBy === "amount"
            ? r.sharePct
            : sumTxInView > 0
              ? (r.txCount / sumTxInView) * 100
              : 0;
        return {
          id: r.service.id,
          serviceLabel: r.service.label,
          partnerName: r.partner.name,
          categoryLabel: t(payPointServiceCategoryLabelKey(r.service.category)),
          channelLabel: t(payPointChannelLabelKey(r.service.channels)),
          amount: r.amount,
          txCount: r.txCount,
          sharePct,
        };
      }),
    [sortedRanking, sumTxInView, topBy, t]
  );

  const categoryFilterOptions = React.useMemo(() => {
    const uniq = Array.from(new Set(rows.map((r) => r.categoryLabel))).sort();
    return uniq.map((label) => ({ value: label, label }));
  }, [rows]);

  const channelFilterOptions = React.useMemo(() => {
    const uniq = Array.from(new Set(rows.map((r) => r.channelLabel))).sort();
    return uniq.map((label) => ({ value: label, label }));
  }, [rows]);

  const columns: Column<ServiceRow>[] = React.useMemo(
    () => [
      { key: "serviceLabel", header: t("dashboard.psp.ppCy.colService"), sortable: true },
      { key: "partnerName", header: t("dashboard.psp.ppCy.colPartner"), sortable: true },
      { key: "categoryLabel", header: t("dashboard.psp.ppCy.colCategory"), sortable: true },
      { key: "channelLabel", header: t("dashboard.psp.ppCy.colChannel"), sortable: true },
      {
        key: "amount",
        header: t("dashboard.psp.ppCy.colAmount"),
        align: "right",
        sortable: true,
        accessor: (r) => r.amount,
        format: (r) =>
          formatCurrency(r.amount, "TRY", { maximumFractionDigits: 0 }),
      },
      {
        key: "sharePct",
        header: t("dashboard.psp.ppCy.colShare"),
        align: "right",
        sortable: true,
        accessor: (r) => Number(r.sharePct.toFixed(2)),
        format: (r) => `${r.sharePct.toFixed(1)}%`,
      },
      {
        key: "txCount",
        header: t("dashboard.psp.ppCy.colTx"),
        align: "right",
        sortable: true,
        accessor: (r) => r.txCount,
        format: (r) => formatNumber(r.txCount, { maximumFractionDigits: 0 }),
      },
    ],
    [t]
  );

  const initialSortKey = topBy === "amount" ? "amount" : "txCount";

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={t("dashboard.psp.ppCy.servicesPageTitle")}
        subtitle={t("dashboard.psp.ppCy.servicesPageSubtitle")}
        preset={preset}
        onPresetChange={setPreset}
        onRefresh={() => setNonce((n) => n + 1)}
        trailing={
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href="/dashboard/psp/paypoint-cyprus">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("dashboard.psp.ppCy.backToOverview")}
            </Link>
          </Button>
        }
      />

      <p className="text-[11px] text-muted-foreground">{t("dashboard.psp.ppCy.demoDisclaimer")}</p>

      <Card>
        <CardHeader className="space-y-3 pb-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-sm">{t("dashboard.psp.ppCy.servicesDirectoryCardTitle")}</CardTitle>
              <CardDescription>{t("dashboard.psp.ppCy.servicesDirectoryFiltersHint")}</CardDescription>
            </div>
            <SegmentToggle
              value={topBy}
              onChange={(v) => setTopBy(v)}
              options={[
                { id: "amount", label: t("common.revenue") },
                { id: "txCount", label: t("common.count") },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-1">
              <Label className="text-xs">{t("dashboard.psp.ppCy.groupLabel")}</Label>
              <Select
                value={group}
                onValueChange={(v) => setGroup(v as PayPointDashboardGroup)}
              >
                <SelectTrigger className="h-9 w-full min-w-[200px] text-xs sm:w-[240px]">
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
              <div className="space-y-1">
                <Label className="text-xs">{t("dashboard.psp.ppCy.muniSection")}</Label>
                <Select
                  value={muniId || "__all__"}
                  onValueChange={(v) => setMuniId(v === "__all__" ? "" : v)}
                >
                  <SelectTrigger className="h-9 w-full min-w-[200px] text-xs sm:w-[280px]">
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
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<ServiceRow>
            key={topBy}
            rows={rows}
            columns={columns}
            rowKey={(r) => r.id}
            searchKeys={["serviceLabel", "partnerName", "categoryLabel", "channelLabel"]}
            searchPlaceholder={t("dashboard.psp.ppCy.servicesSearchPlaceholder")}
            pageSize={10}
            initialSort={{ key: initialSortKey, dir: "desc" }}
            exportName="paypoint-cyprus-services.csv"
            filters={[
              ...(categoryFilterOptions.length > 1
                ? [
                    {
                      id: "category",
                      label: t("dashboard.psp.ppCy.colCategory"),
                      options: categoryFilterOptions,
                      predicate: (r: ServiceRow, v: string) => r.categoryLabel === v,
                    },
                  ]
                : []),
              ...(channelFilterOptions.length > 1
                ? [
                    {
                      id: "channel",
                      label: t("dashboard.psp.ppCy.colChannel"),
                      options: channelFilterOptions,
                      predicate: (r: ServiceRow, v: string) => r.channelLabel === v,
                    },
                  ]
                : []),
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
