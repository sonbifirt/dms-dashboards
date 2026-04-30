"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  Download,
  Landmark,
  Loader2,
  RefreshCw,
  Shield,
  Wallet,
} from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { EncashmentReportTable } from "@/components/dashboard/encashment-report-table";
import { generateEncashmentReport, reportKey as makeReportKey } from "@/lib/data/encashment";
import { dealers } from "@/lib/data/dealers";
import {
  computeDailyCashPositionLedger,
  sumMpsTotal,
} from "@/lib/encashment-cash-position";
import {
  sumManualAdjustmentsForRow,
  useEncashmentDemoStore,
} from "@/lib/encashment-demo-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MessageKey } from "@/lib/i18n/messages/en";

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseLocalInputValue(s: string): Date {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

type WorkflowFilter = "all" | "pending_review" | "approved";

export default function EncashmentControlPage() {
  const { t, dateLocale } = useI18n();
  const { toast } = useToast();
  const now = React.useMemo(() => new Date(), []);
  const [fromStr, setFromStr] = React.useState(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return toLocalInputValue(d);
  });
  const [toStr, setToStr] = React.useState(() => {
    const d = new Date(now);
    d.setHours(23, 59, 0, 0);
    return toLocalInputValue(d);
  });
  const [dealerId, setDealerId] = React.useState<string>("all");
  const [userLogin, setUserLogin] = React.useState("");
  const [nonce, setNonce] = React.useState(0);
  const [wfFilter, setWfFilter] = React.useState<WorkflowFilter>("all");

  const from = parseLocalInputValue(fromStr);
  const to = parseLocalInputValue(toStr);
  const dealerParam =
    dealerId === "all" ? undefined : (Number(dealerId) as number);

  const baseRows = React.useMemo(
    () =>
      generateEncashmentReport({
        from,
        to,
        dealerId: dealerParam,
        maxRows: 15,
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }),
    [from, to, dealerParam, nonce]
  );

  const rk = React.useMemo(
    () => makeReportKey(dealerParam ?? "all", from.toISOString(), to.toISOString()),
    [dealerParam, from, to]
  );

  const {
    hydrated,
    openingSafeBalance,
    ledger,
    withWorkflow,
    toggleReview,
    setExceptionFlag,
    approveRow,
    addManualAdjustment,
    removeManualAdjustment,
    recordBankDepositFromEncashmentRow,
    confirmBankDeposit,
    routeRowToOfficeSafe,
    relaySafeAddToBank,
    resetReportDemo,
  } = useEncashmentDemoStore(rk, baseRows);

  const filtered = React.useMemo(() => {
    let list = withWorkflow;
    if (userLogin.trim()) {
      const q = userLogin.trim().toLowerCase();
      list = list.filter((x) => x.row.kioskId.toLowerCase().includes(q));
    }
    if (wfFilter === "pending_review") {
      return list.filter((x) => !x.workflow.reviewed);
    }
    if (wfFilter === "approved") {
      return list.filter((x) => x.workflow.approved);
    }
    return list;
  }, [withWorkflow, wfFilter, userLogin]);

  const pendingReview = withWorkflow.filter((x) => !x.workflow.reviewed).length;
  const approvedCount = withWorkflow.filter((x) => x.workflow.approved).length;

  const manualAdjTotal = React.useMemo(() => {
    return withWorkflow.reduce(
      (a, x) => a + sumManualAdjustmentsForRow(x.workflow),
      0
    );
  }, [withWorkflow]);

  const officeSafeBookedRowIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const s of ledger.safeAdds) {
      if (s.sourceEncashmentRowId) ids.add(s.sourceEncashmentRowId);
    }
    return ids;
  }, [ledger.safeAdds]);

  const bankDepositsConfirmedTotal = React.useMemo(
    () =>
      ledger.bankDeposits
        .filter((x) => x.depositConfirmed !== false)
        .reduce((a, x) => a + x.amount, 0),
    [ledger.bankDeposits]
  );

  const bankDepositsPendingCount = React.useMemo(
    () => ledger.bankDeposits.filter((x) => x.depositConfirmed === false).length,
    [ledger.bankDeposits]
  );

  const bankDepositsConfirmedCount = React.useMemo(
    () => ledger.bankDeposits.filter((x) => x.depositConfirmed !== false).length,
    [ledger.bankDeposits]
  );

  const safeAddsTotal = React.useMemo(
    () => ledger.safeAdds.reduce((a, x) => a + x.amount, 0),
    [ledger.safeAdds]
  );

  const safeToBankTotal = React.useMemo(
    () => ledger.safeToBank.reduce((a, x) => a + x.amount, 0),
    [ledger.safeToBank]
  );

  const daily = React.useMemo(() => {
    return computeDailyCashPositionLedger({
      openingSafeBalance,
      todayEncashmentsGross: sumMpsTotal(baseRows),
      manualAdjustmentsTotal: manualAdjTotal,
      bankDepositsTotal: bankDepositsConfirmedTotal,
      safeAddsTotal,
      safeToBankTotal,
    });
  }, [
    openingSafeBalance,
    baseRows,
    manualAdjTotal,
    bankDepositsConfirmedTotal,
    safeAddsTotal,
    safeToBankTotal,
  ]);

  const dailyRows: { labelKey: MessageKey; get: (d: typeof daily) => number }[] = React.useMemo(
    () => [
      { labelKey: "encashment.rowOpeningSafeRead", get: (d) => d.openingSafeBalance },
      { labelKey: "encashment.rowTodayGross", get: (d) => d.todayEncashments },
      { labelKey: "encashment.rowManualAdj", get: (d) => d.manualAdjustmentsTotal },
      { labelKey: "encashment.rowBankDeposit", get: (d) => d.bankDepositsTotal },
      { labelKey: "encashment.rowSafeAdds", get: (d) => d.safeAddsTotal },
      { labelKey: "encashment.rowSafeToBank", get: (d) => d.safeToBankTotal },
      { labelKey: "encashment.rowCurrentSafe", get: (d) => d.currentSafeBalance },
      { labelKey: "encashment.rowGrand", get: (d) => d.grandTotal },
    ],
    []
  );

  function exportCsv() {
    const headers = [
      "Kiosk ID",
      "Date",
      "BN Qt",
      "BN Amt",
      "Card Qt",
      "Card Amt",
      "Total Qt",
      "MPS Total",
      "Kiosk Total",
      "Diff",
    ];
    const lines = [headers.join(",")].concat(
      baseRows.map((r) => {
        const d = new Date(r.encashmentAt).toISOString();
        return [
          r.kioskId,
          d,
          r.banknoteQt,
          r.banknoteAmount,
          r.cardQt,
          r.cardAmount,
          r.totalQt,
          r.mpsTotal,
          r.kioskTotal,
          r.difference,
        ]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(",");
      })
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "encashment-report.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t("encashment.toastExportTitle"), description: t("encashment.toastExportDesc") });
  }

  function onGet() {
    setNonce((n) => n + 1);
    toast({ title: t("encashment.toastRefreshTitle"), description: t("encashment.toastRefreshDesc") });
  }

  function handleRouteLineToOfficeSafe(rowId: string) {
    const item = withWorkflow.find((x) => x.row.id === rowId);
    if (!item?.workflow.approved) return;
    const amt =
      item.row.mpsTotal + sumManualAdjustmentsForRow(item.workflow);
    if (amt <= 0) {
      toast({
        title: t("encashment.toastInvalidAmountTitle"),
        variant: "destructive",
      });
      return;
    }
    const ok = routeRowToOfficeSafe(rowId, amt, item.row.kioskId);
    if (!ok) {
      toast({
        title: t("encashment.toastSafeAlreadyBookedTitle"),
        description: t("encashment.toastSafeAlreadyBookedDesc"),
        variant: "destructive",
      });
      return;
    }
    toast({ title: t("encashment.toastRouteSafeTitle"), description: formatCurrency(amt, "TRY", { maximumFractionDigits: 2 }) });
  }

  function handleRelaySafeToBank(safeAddId: string) {
    relaySafeAddToBank(safeAddId);
    toast({
      title: t("encashment.toastRelayBankTitle"),
      description: t("encashment.toastRelayBankDesc"),
    });
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {t("encashment.loading")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1">
            <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2 h-8 text-muted-foreground">
              <Link href="/dashboard/mps">
                <ArrowLeft className="h-4 w-4" />
                {t("encashment.backKiosks")}
              </Link>
            </Button>
          </div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            {t("encashment.pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("encashment.pageSub")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" />
            {t("encashment.excel")}
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={onGet}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t("encashment.get")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("encashment.filters")}</CardTitle>
          <CardDescription>
            {t("encashment.filtersDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("encashment.from")}</Label>
            <Input
              type="datetime-local"
              value={fromStr}
              onChange={(e) => setFromStr(e.target.value)}
              className="h-9 w-[200px] font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("encashment.to")}</Label>
            <Input
              type="datetime-local"
              value={toStr}
              onChange={(e) => setToStr(e.target.value)}
              className="h-9 w-[200px] font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("encashment.dealer")}</Label>
            <Select value={dealerId} onValueChange={setDealerId}>
              <SelectTrigger className="h-9 w-[200px] text-xs">
                <SelectValue placeholder={t("encashment.dealerPh")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("encashment.allDealers")}</SelectItem>
                {dealers.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[200px] flex-1 space-y-1.5">
            <Label className="text-xs">{t("encashment.kioskSearch")}</Label>
            <Input
              value={userLogin}
              onChange={(e) => setUserLogin(e.target.value)}
              placeholder={t("encashment.kioskPh")}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("encashment.workflow")}</Label>
            <Select
              value={wfFilter}
              onValueChange={(v) => setWfFilter(v as WorkflowFilter)}
            >
              <SelectTrigger className="h-9 w-[180px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("encashment.wfAll")}</SelectItem>
                <SelectItem value="pending_review">{t("encashment.wfPendingReview")}</SelectItem>
                <SelectItem value="approved">{t("encashment.wfApproved")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4">
        <KpiCard
          label={t("encashment.kpiPending")}
          value={pendingReview}
          sub={t("encashment.kpiPendingSub")}
          icon={ClipboardList}
          tone="warning"
        />
        <KpiCard
          label={t("encashment.kpiApproved")}
          value={approvedCount}
          sub={t("encashment.kpiApprovedSub")}
          icon={Shield}
          tone="success"
        />
        <KpiCard
          label={t("encashment.kpiSafeBalance")}
          value={daily.currentSafeBalance}
          format={(v) =>
            formatCurrency(v, "TRY", { maximumFractionDigits: 2 })
          }
          sub={t("encashment.kpiSafeBalanceSub")}
          icon={Wallet}
          tone="info"
        />
        <KpiCard
          label={t("encashment.kpiBankLedger")}
          value={bankDepositsConfirmedTotal}
          format={(v) =>
            formatCurrency(v, "TRY", { maximumFractionDigits: 2 })
          }
          sub={t("encashment.kpiBankLedgerSubV2", {
            confirmed: bankDepositsConfirmedCount,
            pending: bankDepositsPendingCount,
          })}
          icon={Landmark}
          tone="brand"
        />
      </div>

      <div className="space-y-5">
        <div>
          <h2 className="mb-2 text-sm font-semibold">
            {t("encashment.tableHeader")}
          </h2>
          <EncashmentReportTable
            items={filtered}
            officeSafeBookedRowIds={officeSafeBookedRowIds}
            ledgerBankDeposits={ledger.bankDeposits}
            onToggleReview={toggleReview}
            onApprove={approveRow}
            onToggleException={setExceptionFlag}
            onAddManualAdjustment={addManualAdjustment}
            onRemoveManualAdjustment={removeManualAdjustment}
            onRouteLineToOfficeSafe={handleRouteLineToOfficeSafe}
            onConfirmBankDeposit={confirmBankDeposit}
            onRecordBankDepositForRow={recordBankDepositFromEncashmentRow}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t("encashment.rowCountSingle", {
            n: filtered.length,
          })}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("encashment.cashPos")}</CardTitle>
            <CardDescription>
              {t("encashment.cashPosSub")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {dailyRows.map((row) => (
              <div
                key={row.labelKey}
                className="flex items-center justify-between gap-2 border-b border-border/40 py-1.5 last:border-0"
              >
                <span className="text-muted-foreground">{t(row.labelKey)}</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(row.get(daily), "TRY", { maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("encashment.ledgerActions")}</CardTitle>
            <CardDescription>{t("encashment.ledgerActionsSub")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("encashment.safeAddSection")}
              </div>
              <p className="text-[11px] text-muted-foreground">{t("encashment.safeManualClosedHint")}</p>
              {ledger.safeAdds.length ? (
                <ul className="mt-2 space-y-1 text-xs">
                  {ledger.safeAdds.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5"
                    >
                      <span className="min-w-0 flex-1">
                        {s.kioskLabel ? (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {s.kioskLabel}
                            {" · "}
                          </span>
                        ) : null}
                        {formatCurrency(s.amount, "TRY", { maximumFractionDigits: 2 })} ·{" "}
                        {new Date(s.at).toLocaleString(dateLocale)}
                      </span>
                      <div className="flex shrink-0 flex-wrap items-center gap-1">
                        {s.safeToBankEntryId ? (
                          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                            {t("encashment.safeRelayQueuedBadge")}
                          </span>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 gap-1 px-2 text-[11px]"
                            onClick={() => handleRelaySafeToBank(s.id)}
                          >
                            <Landmark className="h-3.5 w-3.5" />
                            {t("encashment.safeRelayToBankBtn")}
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-muted-foreground">{t("encashment.safeAddsEmpty")}</p>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!confirm(t("encashment.resetConfirm"))) return;
                resetReportDemo();
                toast({
                  title: t("encashment.resetToastTitle"),
                  description: t("encashment.resetToastDesc"),
                });
              }}
            >
              {t("encashment.resetDemo")}
            </Button>
            <p className="text-[11px] text-muted-foreground">{t("encashment.demoNote")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
