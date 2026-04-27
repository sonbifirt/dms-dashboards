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
  attachRouting,
  BANK_SAFE_CUTOFF,
  computeDailyCashPosition,
  sumMpsTotal,
} from "@/lib/encashment-cash-position";
import { useEncashmentDemoStore } from "@/lib/encashment-demo-store";
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

type WorkflowFilter = "all" | "approved" | "in_safe" | "deposited";

function mapDepositReason(
  reason: string,
  t: (k: MessageKey) => string
): string {
  if (reason === "No rows") return t("encashment.reasonNoRows");
  if (reason === "No approved pre-cutoff rows")
    return t("encashment.reasonNoApproved");
  return reason;
}

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
        maxRows: 50,
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
    carryForwardOpening,
    setCarryForwardOpening,
    withWorkflow,
    bankInfo,
    toggleReview,
    setExceptionFlag,
    approveRow,
    confirmBulkBankDeposit,
    resetReportDemo,
  } = useEncashmentDemoStore(rk, baseRows, BANK_SAFE_CUTOFF);

  const filtered = React.useMemo(() => {
    if (userLogin.trim()) {
      const q = userLogin.trim().toLowerCase();
      return withWorkflow.filter((x) => x.row.kioskId.toLowerCase().includes(q));
    }
    if (wfFilter === "all") return withWorkflow;
    return withWorkflow.filter(({ row: r, workflow: w }) => {
      if (wfFilter === "deposited") return w.deposited;
      if (wfFilter === "approved")
        return w.approved && !w.deposited;
      if (wfFilter === "in_safe") {
        return (
          w.routing === "post_cutoff_safe" &&
          w.approved &&
          !w.deposited
        );
      }
      return true;
    });
  }, [withWorkflow, wfFilter, userLogin]);

  const preTableRows = React.useMemo(
    () => filtered.filter((x) => x.workflow.routing === "pre_cutoff_bank"),
    [filtered]
  );
  const postTableRows = React.useMemo(
    () => filtered.filter((x) => x.workflow.routing === "post_cutoff_safe"),
    [filtered]
  );

  const pendingReview = withWorkflow.filter((x) => !x.workflow.reviewed).length;
  const approvedCount = withWorkflow.filter(
    (x) => x.workflow.approved
  ).length;
  const inSafeCount = withWorkflow.filter(
    (x) =>
      x.workflow.routing === "post_cutoff_safe" &&
      x.workflow.approved &&
      !x.workflow.deposited
  ).length;
  const depositedCount = withWorkflow.filter((x) => x.workflow.deposited)
    .length;

  const daily = React.useMemo(() => {
    const routed = attachRouting(baseRows, BANK_SAFE_CUTOFF);
    let postSafe = 0;
    let prePending = 0;
    for (const r of routed) {
      const w = withWorkflow.find((v) => v.row.id === r.id)?.workflow;
      if (r.routing === "post_cutoff_safe") {
        if (w?.approved) {
          postSafe += r.mpsTotal;
        }
        continue;
      }
      if (w?.approved && r.routing === "pre_cutoff_bank" && !w.deposited) {
        prePending += r.mpsTotal;
      }
    }
    const sameDayBank = bankInfo?.totalAmount ?? 0;
    return computeDailyCashPosition({
      openingSafeBalance: carryForwardOpening,
      todayEncashmentsGross: sumMpsTotal(baseRows),
      sameDayBankDeposit: sameDayBank,
      postCutoffToSafe: postSafe,
      preCutoffPendingBank: prePending,
    });
  }, [baseRows, withWorkflow, bankInfo, carryForwardOpening]);

  const dailyRows: { labelKey: MessageKey; get: (d: typeof daily) => number }[] = React.useMemo(
    () => [
      { labelKey: "encashment.rowTodayGross", get: (d) => d.todayEncashments },
      { labelKey: "encashment.rowBankDeposit", get: (d) => d.sameDayBankDeposit },
      { labelKey: "encashment.rowPostSafe", get: (d) => d.postCutoffToSafe },
      { labelKey: "encashment.rowPrePending", get: (d) => d.preCutoffPendingBank },
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
              <SelectTrigger className="h-9 w-[160px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("encashment.wfAll")}</SelectItem>
                <SelectItem value="approved">{t("encashment.wfApproved")}</SelectItem>
                <SelectItem value="in_safe">{t("encashment.wfInSafe")}</SelectItem>
                <SelectItem value="deposited">{t("encashment.wfDeposited")}</SelectItem>
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
          label={t("encashment.kpiInSafe")}
          value={inSafeCount}
          sub={t("encashment.kpiInSafeSub")}
          icon={Wallet}
          tone="info"
        />
        <KpiCard
          label={t("encashment.kpiDeposited")}
          value={depositedCount}
          sub={bankInfo ? t("encashment.kpiBatch", { id: bankInfo.batchId }) : t("encashment.kpiNoBatch")}
          icon={Landmark}
          tone="brand"
        />
      </div>

      <div className="space-y-5">
        <div>
          <h2 className="mb-2 text-sm font-semibold">
            {t("encashment.preHeader")}
          </h2>
          <EncashmentReportTable
            mode="pre"
            items={preTableRows}
            onToggleReview={toggleReview}
            onApprove={approveRow}
            onToggleException={setExceptionFlag}
          />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">
            {t("encashment.postHeader")}
          </h2>
          <p className="mb-2 text-xs text-muted-foreground">
            {t("encashment.postNote")}
          </p>
          {postTableRows.length === 0 ? (
            <p className="mb-2 text-xs text-muted-foreground">
              {t("encashment.postEmpty")}
            </p>
          ) : null}
          <EncashmentReportTable
            mode="post"
            items={postTableRows}
            onToggleReview={toggleReview}
            onApprove={approveRow}
            onToggleException={setExceptionFlag}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t("encashment.rowCount", {
            n: filtered.length,
            pre: preTableRows.length,
            post: postTableRows.length,
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
            <div className="flex items-center justify-between gap-2 border-b border-border/60 py-1.5">
              <span className="text-muted-foreground">{t("encashment.openingSafe")}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="h-8 w-36 text-right text-xs tabular-nums"
                  value={carryForwardOpening}
                  onChange={(e) => setCarryForwardOpening(Number(e.target.value) || 0)}
                />
              </div>
            </div>
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
            <CardTitle className="text-sm">{t("encashment.bankBulk")}</CardTitle>
            <CardDescription>
              {t("encashment.bankBulkSub")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bankInfo ? (
              <div className="rounded-md border border-success/30 bg-success/5 px-3 py-2 text-sm">
                <div className="font-medium text-success">{t("encashment.bankDeposited")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("encashment.kpiBatch", { id: bankInfo.batchId })} ·{" "}
                  {new Date(bankInfo.at).toLocaleString(dateLocale)} ·{" "}
                  {formatCurrency(bankInfo.totalAmount, "TRY", { maximumFractionDigits: 2 })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("encashment.bankNoBatch")}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                disabled={!!bankInfo}
                onClick={() => {
                  const r = confirmBulkBankDeposit();
                  if (r.ok) {
                    toast({
                      title: t("encashment.toastBankTitle"),
                      description: `${r.batchId} · ${formatCurrency(r.totalAmount, "TRY", { maximumFractionDigits: 2 })}`,
                    });
                  } else {
                    toast({
                      title: t("encashment.toastNoDepositTitle"),
                      description: mapDepositReason(r.reason, t),
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Landmark className="mr-2 h-4 w-4" />
                {t("encashment.confirmBank")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (
                    !confirm(
                      t("encashment.resetConfirm")
                    )
                  ) {
                    return;
                  }
                  resetReportDemo();
                  toast({ title: t("encashment.resetToastTitle"), description: t("encashment.resetToastDesc") });
                }}
              >
                {t("encashment.resetDemo")}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t("encashment.demoNote")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
