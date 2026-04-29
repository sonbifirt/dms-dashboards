"use client";

import * as React from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Landmark,
  PenLine,
  Trash2,
  Wallet,
} from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type { EncashmentRowData } from "@/lib/data/encashment";
import type { EncashmentRouting } from "@/lib/encashment-cash-position";
import {
  sumManualAdjustmentsForRow,
  type BankDepositEntry,
  type EncashmentRowWorkflow,
} from "@/lib/encashment-demo-store";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MessageKey } from "@/lib/i18n/messages/en";

export type EncashmentRowView = {
  row: EncashmentRowData;
  workflow: EncashmentRowWorkflow & {
    effectiveException: boolean;
    routing: EncashmentRouting;
  };
};

function formatDt(iso: string, dateLocale: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = d.toLocaleDateString(dateLocale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const tt = d.toLocaleTimeString(dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${dd} ${tt}`;
}

function RowStatusBadge({
  w,
  row,
  bookedToOfficeSafe,
  t,
}: {
  w: EncashmentRowView["workflow"];
  row: EncashmentRowData;
  bookedToOfficeSafe: boolean;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}) {
  if (bookedToOfficeSafe) {
    return (
      <StatusBadge tone="warning">{t("encashmentTable.statusOfficeSafeBooked")}</StatusBadge>
    );
  }
  if (w.approved) {
    return (
      <StatusBadge tone="success">
        {w.effectiveException || row.hasNumericMismatch
          ? t("encashmentTable.statusApprovedVar")
          : t("encashmentTable.statusMatched")}
      </StatusBadge>
    );
  }
  if (w.effectiveException || w.exceptionFlag) {
    return <StatusBadge tone="danger">{t("encashmentTable.statusException")}</StatusBadge>;
  }
  if (w.reviewed) {
    return <StatusBadge tone="info">{t("encashmentTable.statusReviewed")}</StatusBadge>;
  }
  return <StatusBadge tone="muted">{t("encashmentTable.statusPending")}</StatusBadge>;
}

const CONTROL_COLS = 8;

interface EncashmentReportTableProps {
  items: EncashmentRowView[];
  /** Row IDs that already have an office-safe ledger line */
  officeSafeBookedRowIds: ReadonlySet<string>;
  /** Ledger bank lines (includes optional row links for the Bank column). */
  ledgerBankDeposits: readonly BankDepositEntry[];
  onToggleReview: (rowId: string) => void;
  onApprove: (rowId: string) => void;
  onToggleException: (rowId: string, value: boolean) => void;
  onAddManualAdjustment: (rowId: string, amount: number, note?: string) => void;
  onRemoveManualAdjustment: (rowId: string, adjustmentId: string) => void;
  /** Effective line (MPS + adjustments) booked to office safe — requires approved row */
  onRouteLineToOfficeSafe: (rowId: string) => void;
  /** Confirm a bank ledger line (third control). */
  onConfirmBankDeposit: (depositId: string) => void;
  /** Create a bank ledger line linked to this row (one per row max). */
  onRecordBankDepositForRow: (
    rowId: string,
    amount: number,
    depositedAt: string
  ) => void;
}

export function EncashmentReportTable({
  items,
  officeSafeBookedRowIds,
  ledgerBankDeposits,
  onToggleReview,
  onApprove,
  onToggleException,
  onAddManualAdjustment,
  onRemoveManualAdjustment,
  onRouteLineToOfficeSafe,
  onConfirmBankDeposit,
  onRecordBankDepositForRow,
}: EncashmentReportTableProps) {
  const { t, dateLocale } = useI18n();
  const [openLogId, setOpenLogId] = React.useState<string | null>(null);
  const [sheetRowId, setSheetRowId] = React.useState<string | null>(null);
  const [adjAmount, setAdjAmount] = React.useState("");
  const [adjNote, setAdjNote] = React.useState("");

  const sheetRow = React.useMemo(
    () => items.find((x) => x.row.id === sheetRowId) ?? null,
    [items, sheetRowId]
  );

  const totals = React.useMemo(() => {
    let banknoteQt = 0;
    let banknoteAmt = 0;
    let cardQt = 0;
    let cardAmt = 0;
    let totQt = 0;
    let mps = 0;
    let kiosk = 0;
    let diff = 0;
    let manualAdj = 0;
    let effectiveMps = 0;
    for (const { row, workflow: w } of items) {
      banknoteQt += row.banknoteQt;
      banknoteAmt += row.banknoteAmount;
      cardQt += row.cardQt;
      cardAmt += row.cardAmount;
      totQt += row.totalQt;
      mps += row.mpsTotal;
      kiosk += row.kioskTotal;
      diff += row.difference;
      const adj = sumManualAdjustmentsForRow(w);
      manualAdj += adj;
      effectiveMps += row.mpsTotal + adj;
    }
    return {
      banknoteQt,
      banknoteAmt,
      cardQt,
      cardAmt,
      totQt,
      mps,
      kiosk,
      diff,
      manualAdj,
      effectiveMps,
    };
  }, [items]);

  const colSpanFull = 10 + CONTROL_COLS;

  function submitAdjustment() {
    if (!sheetRowId) return;
    const n = Number(String(adjAmount).replace(",", "."));
    if (!Number.isFinite(n) || n === 0) return;
    onAddManualAdjustment(sheetRowId, n, adjNote.trim() || undefined);
    setAdjAmount("");
    setAdjNote("");
  }

  const sheetLocked = sheetRow?.workflow.approved ?? false;

  const bankByRowId = React.useMemo(() => {
    const m = new Map<string, BankDepositEntry>();
    for (const d of ledgerBankDeposits) {
      if (d.sourceEncashmentRowId) {
        m.set(d.sourceEncashmentRowId, d);
      }
    }
    return m;
  }, [ledgerBankDeposits]);

  const mainScrollRef = React.useRef<HTMLDivElement>(null);
  const topMirrorRef = React.useRef<HTMLDivElement>(null);
  const mirrorInnerRef = React.useRef<HTMLDivElement>(null);
  const syncScrollLock = React.useRef(false);
  const [tableHOverflow, setTableHOverflow] = React.useState(false);

  const syncMirrorMetrics = React.useCallback(() => {
    const main = mainScrollRef.current;
    const inner = mirrorInnerRef.current;
    const mirror = topMirrorRef.current;
    if (!main || !inner) return;
    inner.style.width = `${main.scrollWidth}px`;
    const overflow = main.scrollWidth > main.clientWidth + 2;
    setTableHOverflow(overflow);
    if (overflow && mirror) {
      mirror.scrollLeft = main.scrollLeft;
    }
  }, []);

  React.useLayoutEffect(() => {
    syncMirrorMetrics();
    const id = requestAnimationFrame(() => syncMirrorMetrics());
    return () => cancelAnimationFrame(id);
  }, [items, ledgerBankDeposits, syncMirrorMetrics]);

  React.useEffect(() => {
    const main = mainScrollRef.current;
    if (!main) return;
    const table = main.querySelector("table");
    const ro = new ResizeObserver(() => syncMirrorMetrics());
    ro.observe(main);
    if (table) ro.observe(table);
    window.addEventListener("resize", syncMirrorMetrics);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncMirrorMetrics);
    };
  }, [syncMirrorMetrics]);

  function onMainTableScroll() {
    const main = mainScrollRef.current;
    const mirror = topMirrorRef.current;
    if (!main || !mirror || syncScrollLock.current) return;
    syncScrollLock.current = true;
    mirror.scrollLeft = main.scrollLeft;
    syncScrollLock.current = false;
  }

  function onTopMirrorScroll() {
    const main = mainScrollRef.current;
    const mirror = topMirrorRef.current;
    if (!main || !mirror || syncScrollLock.current) return;
    syncScrollLock.current = true;
    main.scrollLeft = mirror.scrollLeft;
    syncScrollLock.current = false;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="overflow-hidden rounded-lg border bg-card">
        <div
          className={cn(
            "border-b border-border bg-muted/40 scrollbar-thin",
            tableHOverflow ? "block" : "hidden"
          )}
          aria-hidden={!tableHOverflow}
        >
          <div
            ref={topMirrorRef}
            className="overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch]"
            onScroll={onTopMirrorScroll}
            tabIndex={-1}
          >
            <div ref={mirrorInnerRef} className="h-2 shrink-0" />
          </div>
        </div>
        <div
          ref={mainScrollRef}
          className="scrollbar-thin overflow-x-auto [-webkit-overflow-scrolling:touch]"
          onScroll={onMainTableScroll}
        >
        <table className="w-full min-w-[760px] border-collapse text-[11px] xl:text-sm 2xl:min-w-[980px]">
          <thead>
            <tr className="bg-muted/70 text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="sticky left-0 z-20 border-b border-r bg-muted/90 px-2 py-2 text-left">
                {t("encashmentTable.kioskId")}
              </th>
              <th className="border-b border-r bg-muted/70 px-2 py-2 text-left">
                {t("encashmentTable.dateTime")}
              </th>
              <th className="border-b px-2 py-2 text-center" colSpan={2}>
                {t("encashmentTable.kioskBanknotes")}
              </th>
              <th className="border-b px-2 py-2 text-center" colSpan={2}>
                {t("encashmentTable.kioskCards")}
              </th>
              <th className="border-b px-2 py-2 text-center" colSpan={4}>
                {t("encashmentTable.totals")}
              </th>
              <th
                className="border-b bg-primary/10 px-2 py-2 text-center"
                colSpan={CONTROL_COLS}
              >
                {t("encashmentTable.control")}
              </th>
            </tr>
            <tr className="bg-muted/50 text-[10px] text-muted-foreground">
              <th className="sticky left-0 z-20 border-b border-r bg-muted/80 px-2 py-1.5" />
              <th className="border-b border-r px-2 py-1.5" />
              <th className="border-b px-1 py-1.5 text-right">{t("encashmentTable.qty")}</th>
              <th className="border-b border-r px-1 py-1.5 text-right">
                {t("encashmentTable.amount")}
              </th>
              <th className="border-b px-1 py-1.5 text-right">{t("encashmentTable.qty")}</th>
              <th className="border-b border-r px-1 py-1.5 text-right">
                {t("encashmentTable.amount")}
              </th>
              <th className="border-b px-1 py-1.5 text-right">{t("encashmentTable.qty")}</th>
              <th className="border-b px-1 py-1.5 text-right">{t("encashmentTable.mpsTotal")}</th>
              <th className="border-b px-1 py-1.5 text-right">
                {t("encashmentTable.kioskTotal")}
              </th>
              <th className="border-b border-r px-1 py-1.5 text-right">
                {t("encashmentTable.diff")}
              </th>
              <th className="border-b px-1 py-1.5 text-center">{t("encashmentTable.review")}</th>
              <th className="border-b px-1 py-1.5 text-center">{t("encashmentTable.manualCol")}</th>
              <th className="border-b px-1 py-1.5 text-left">{t("encashmentTable.status")}</th>
              <th className="border-b px-1 py-1.5 text-center">{t("encashmentTable.approve")}</th>
              <th className="border-b px-0.5 py-1.5 text-center xl:px-1">
                <span className="hidden xl:inline">{t("encashmentTable.bankCol")}</span>
                <abbr
                  className="cursor-help xl:hidden"
                  title={t("encashmentTable.bankCol")}
                >
                  Bnk
                </abbr>
              </th>
              <th className="border-b px-1 py-1.5 text-center">{t("encashmentTable.officeSafe")}</th>
              <th className="border-b px-1 py-1.5 text-center">{t("encashmentTable.exc")}</th>
              <th className="sticky right-0 z-[12] border-b border-l border-border/70 bg-muted/80 px-1 py-1.5 text-center shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.12)]">
                {t("encashmentTable.log")}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ row, workflow: w }) => {
              const expanded = openLogId === row.id;
              const canApprove = !w.approved;
              const adjSum = sumManualAdjustmentsForRow(w);
              const bookedSafe = officeSafeBookedRowIds.has(row.id);
              const effectiveLine = row.mpsTotal + adjSum;
              const rowBankDeposit = bankByRowId.get(row.id);
              const canRouteSafe =
                w.approved &&
                !bookedSafe &&
                effectiveLine > 0 &&
                !rowBankDeposit;
              const canRecordBank =
                w.approved &&
                effectiveLine > 0 &&
                !rowBankDeposit &&
                !bookedSafe;
              const bankAwaitConfirm =
                !!rowBankDeposit && rowBankDeposit.depositConfirmed === false;
              const bankConfirmedLine =
                !!rowBankDeposit && rowBankDeposit.depositConfirmed !== false;
              const rowDepositDate =
                typeof row.encashmentAt === "string" && row.encashmentAt.length >= 10
                  ? row.encashmentAt.slice(0, 10)
                  : new Date(row.encashmentAt).toISOString().slice(0, 10);
              return (
                <React.Fragment key={row.id}>
                  <tr
                    className={cn(
                      "border-b border-border/60 hover:bg-muted/30",
                      w.effectiveException && "bg-destructive/5"
                    )}
                  >
                    <td className="sticky left-0 z-10 border-r bg-card px-2 py-1.5 font-mono text-xs">
                      {row.kioskId}
                    </td>
                    <td className="whitespace-nowrap border-r px-2 py-1.5 text-xs text-muted-foreground">
                      {formatDt(row.encashmentAt, dateLocale)}
                    </td>
                    <td className="px-1 py-1.5 text-right tabular-nums">
                      {formatNumber(row.banknoteQt, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="border-r px-1 py-1.5 text-right tabular-nums">
                      {formatCurrency(row.banknoteAmount, "TRY", {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-1 py-1.5 text-right tabular-nums">
                      {formatNumber(row.cardQt, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="border-r px-1 py-1.5 text-right tabular-nums">
                      {formatCurrency(row.cardAmount, "TRY", {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-1 py-1.5 text-right tabular-nums">
                      {formatNumber(row.totalQt, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-1 py-1.5 text-right font-medium tabular-nums">
                      <div>{formatCurrency(row.mpsTotal, "TRY", { maximumFractionDigits: 2 })}</div>
                      {adjSum !== 0 ? (
                        <div className="text-[10px] font-normal text-muted-foreground">
                          + {formatCurrency(adjSum, "TRY", { maximumFractionDigits: 2 })}{" "}
                          {t("encashmentTable.adjHint")}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-1 py-1.5 text-right tabular-nums">
                      {formatCurrency(row.kioskTotal, "TRY", {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className={cn(
                        "border-r px-1 py-1.5 text-right tabular-nums",
                        Math.abs(row.difference) > 0.01 ? "text-destructive" : ""
                      )}
                    >
                      {formatCurrency(row.difference, "TRY", {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1">
                            <Checkbox
                              checked={w.reviewed}
                              onCheckedChange={() => onToggleReview(row.id)}
                              disabled={w.approved}
                              aria-label={t("encashmentTable.reviewedAria")}
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px] text-xs">
                          {w.approved
                            ? t("encashmentTable.ttReviewLockedApproved")
                            : t("encashmentTable.ttReviewHint")}
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="tabular-nums text-[11px]">
                          {adjSum === 0
                            ? "—"
                            : formatCurrency(adjSum, "TRY", { maximumFractionDigits: 2 })}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-0.5 px-1 text-[9px] xl:gap-1 xl:px-2 xl:text-[10px]"
                          disabled={w.approved}
                          aria-label={t("encashmentTable.manualEdit")}
                          onClick={() => {
                            setSheetRowId(row.id);
                            setAdjAmount("");
                            setAdjNote("");
                          }}
                        >
                          <PenLine className="h-3 w-3 shrink-0" />
                          <span className="hidden xl:inline">
                            {t("encashmentTable.manualEdit")}
                          </span>
                        </Button>
                      </div>
                    </td>
                    <td className="px-1 py-1.5">
                      <RowStatusBadge
                        w={w}
                        row={row}
                        bookedToOfficeSafe={bookedSafe}
                        t={t}
                      />
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={!canApprove}
                              onClick={() => onApprove(row.id)}
                              aria-label={
                                w.approved
                                  ? t("encashmentTable.approveDone")
                                  : t("encashmentTable.approveBtn")
                              }
                              className={cn(
                                "h-7 gap-0.5 px-1 text-[9px] xl:px-2 xl:text-[10px]",
                                w.approved &&
                                  "!bg-blue-600 !text-white shadow-none hover:!bg-blue-700 dark:!bg-blue-600 dark:hover:!bg-blue-700"
                              )}
                            >
                              <span className="hidden xl:inline">
                                {w.approved
                                  ? t("encashmentTable.approveDone")
                                  : t("encashmentTable.approveBtn")}
                              </span>
                              <span className="xl:hidden" aria-hidden="true">
                                {w.approved ? "✓" : "A"}
                              </span>
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px] text-xs">
                          {w.approved
                            ? t("encashmentTable.ttApproved")
                            : t("encashmentTable.ttApproveGeneric")}
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="max-w-[4rem] px-0.5 py-1.5 text-center align-middle xl:max-w-none xl:px-1">
                      {bankConfirmedLine ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="hidden min-[1360px]:inline">
                              {t("encashmentTable.bankDone")}
                            </span>
                          </span>
                        </div>
                      ) : bankAwaitConfirm ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Button
                                type="button"
                                size="sm"
                                variant="default"
                                className="h-7 gap-0.5 px-1 text-[9px] xl:gap-1 xl:px-1.5 xl:text-[10px]"
                                onClick={() =>
                                  rowBankDeposit &&
                                  onConfirmBankDeposit(rowBankDeposit.id)
                                }
                                aria-label={t("encashmentTable.bankConfirmBtn")}
                              >
                                <Landmark className="h-3 w-3 shrink-0" />
                                <span className="hidden xl:inline">
                                  {t("encashmentTable.bankConfirmBtn")}
                                </span>
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[240px] text-xs">
                            {t("encashmentTable.ttBankConfirm")}
                          </TooltipContent>
                        </Tooltip>
                      ) : canRecordBank ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 gap-0.5 px-1 text-[9px] xl:px-1.5 xl:text-[10px]"
                                onClick={() =>
                                  onRecordBankDepositForRow(
                                    row.id,
                                    effectiveLine,
                                    rowDepositDate
                                  )
                                }
                                aria-label={t("encashmentTable.bankRecordLedger")}
                              >
                                <Landmark className="h-3 w-3 shrink-0" />
                                <span className="hidden xl:inline">
                                  {t("encashmentTable.bankRecordLedger")}
                                </span>
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[240px] text-xs">
                            {t("encashmentTable.ttBankRecord", {
                              amt: formatCurrency(effectiveLine, "TRY", {
                                maximumFractionDigits: 2,
                              }),
                            })}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default text-[10px] text-muted-foreground">
                              —
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px] text-xs">
                            {!w.approved
                              ? t("encashmentTable.ttBankNeedApprove")
                              : bookedSafe
                                ? t("encashmentTable.ttBankBlockedBySafe")
                                : t("encashmentTable.ttBankZeroLine")}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <Button
                              type="button"
                              size="sm"
                              variant={bookedSafe ? "secondary" : "outline"}
                              className={cn(
                                "h-7 gap-0.5 border-amber-400/80 px-1 text-[9px] xl:px-1.5 xl:text-[10px]",
                                bookedSafe &&
                                  "border-amber-500/70 bg-amber-400/30 text-amber-950 hover:bg-amber-400/45 dark:bg-amber-500/25 dark:text-amber-50 dark:hover:bg-amber-500/35",
                                !bookedSafe &&
                                  canRouteSafe &&
                                  "border-amber-500 bg-amber-400 text-amber-950 hover:bg-amber-500 hover:text-amber-950 dark:bg-amber-500 dark:text-white dark:hover:bg-amber-600",
                                !bookedSafe &&
                                  !canRouteSafe &&
                                  "border-amber-300/60 bg-amber-400/15 text-amber-900/85 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100/80"
                              )}
                              disabled={!canRouteSafe}
                              aria-label={
                                bookedSafe
                                  ? t("encashmentTable.safeDone")
                                  : t("encashmentTable.safeRoute")
                              }
                              onClick={() => onRouteLineToOfficeSafe(row.id)}
                            >
                              <Wallet className="h-3 w-3 shrink-0" />
                              <span className="hidden xl:inline">
                                {bookedSafe
                                  ? t("encashmentTable.safeDone")
                                  : t("encashmentTable.safeRoute")}
                              </span>
                            </Button>
                          </span>
                        </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[280px] text-xs">
                          {bookedSafe
                            ? t("encashmentTable.ttSafeBooked")
                            : rowBankDeposit
                              ? t("encashmentTable.ttSafeBlockedByBank")
                              : !w.approved
                                ? t("encashmentTable.ttSafeNeedApprove")
                                : t("encashmentTable.ttSafeRoute", {
                                    amt: formatCurrency(effectiveLine, "TRY", {
                                      maximumFractionDigits: 2,
                                    }),
                                  })}
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <Checkbox
                              checked={w.exceptionFlag}
                              onCheckedChange={(c) =>
                                onToggleException(row.id, c === true)
                              }
                              aria-label={t("encashmentTable.excAria")}
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{t("encashmentTable.excTt")}</TooltipContent>
                      </Tooltip>
                      {row.hasNumericMismatch && (
                        <AlertTriangle className="ml-0.5 inline h-3.5 w-3.5 text-amber-500" />
                      )}
                    </td>
                    <td className="sticky right-0 z-[11] border-l border-border/70 bg-card px-1 py-1.5 text-center shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.1)]">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-0.5 px-1.5"
                        onClick={() =>
                          setOpenLogId((id) => (id === row.id ? null : row.id))
                        }
                        aria-label={t("encashmentTable.logAria")}
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        {expanded ? (
                          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                        )}
                      </Button>
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="bg-muted/25">
                      <td
                        colSpan={colSpanFull}
                        className="border-b px-3 py-2 text-xs"
                      >
                        <div className="font-medium text-foreground/90">
                          {t("encashmentTable.auditTitle", { id: row.kioskId })}
                        </div>
                        {w.audit.length === 0 ? (
                          <p className="text-muted-foreground">
                            {t("encashmentTable.noLogEntries")}
                          </p>
                        ) : (
                          <ul className="mt-1.5 max-h-40 space-y-1 overflow-y-auto">
                            {[...w.audit].reverse().map((a, i) => (
                              <li
                                key={`${a.at}-${i}`}
                                className="flex flex-wrap gap-x-2 text-muted-foreground"
                              >
                                <span className="tabular-nums text-[10px]">
                                  {new Date(a.at).toLocaleString(dateLocale)}
                                </span>
                                <span className="text-foreground">
                                  {a.displayName}
                                </span>
                                <span>— {a.action}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/80 text-xs font-medium">
              <td
                className="sticky left-0 z-10 border-t border-r bg-muted/90 px-2 py-2"
                colSpan={2}
              >
                {t("encashmentTable.total")}
              </td>
              <td className="border-t px-1 py-2 text-right tabular-nums">
                {formatNumber(totals.banknoteQt, { maximumFractionDigits: 0 })}
              </td>
              <td className="border-t px-1 py-2 text-right tabular-nums">
                {formatCurrency(totals.banknoteAmt, "TRY", {
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="border-t px-1 py-2 text-right tabular-nums">
                {formatNumber(totals.cardQt, { maximumFractionDigits: 0 })}
              </td>
              <td className="border-t border-r px-1 py-2 text-right tabular-nums">
                {formatCurrency(totals.cardAmt, "TRY", { maximumFractionDigits: 2 })}
              </td>
              <td className="border-t px-1 py-2 text-right tabular-nums">
                {formatNumber(totals.totQt, { maximumFractionDigits: 0 })}
              </td>
              <td className="border-t px-1 py-2 text-right tabular-nums">
                <div>{formatCurrency(totals.mps, "TRY", { maximumFractionDigits: 2 })}</div>
                {totals.manualAdj !== 0 ? (
                  <div className="mt-0.5 text-[10px] font-semibold text-primary">
                    {t("encashmentTable.footerEffective")}:{" "}
                    {formatCurrency(totals.effectiveMps, "TRY", { maximumFractionDigits: 2 })}
                  </div>
                ) : null}
              </td>
              <td className="border-t px-1 py-2 text-right tabular-nums">
                {formatCurrency(totals.kiosk, "TRY", { maximumFractionDigits: 2 })}
              </td>
              <td className="border-t border-r px-1 py-2 text-right tabular-nums">
                {formatCurrency(totals.diff, "TRY", { maximumFractionDigits: 2 })}
              </td>
              <td className="border-t px-1 py-2 text-muted-foreground" />
              <td className="border-t px-1 py-2 text-right tabular-nums">
                {totals.manualAdj === 0
                  ? "—"
                  : formatCurrency(totals.manualAdj, "TRY", { maximumFractionDigits: 2 })}
              </td>
              <td
                colSpan={6}
                className="border-t px-2 py-2 text-muted-foreground"
              >
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  {t("encashmentTable.footerCount", { n: items.length })}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
        </div>
      </div>
      <p className="mt-1.5 px-1 text-[11px] text-muted-foreground xl:hidden">
        {t("encashmentTable.scrollHint")}
      </p>

      <Sheet open={sheetRow !== null} onOpenChange={(o) => !o && setSheetRowId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("encashmentTable.manualSheetTitle")}</SheetTitle>
            <SheetDescription>
              {sheetRow
                ? t("encashmentTable.manualSheetDesc", { id: sheetRow.row.kioskId })
                : ""}
            </SheetDescription>
          </SheetHeader>
          {sheetRow ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-border p-3 text-sm">
                <div className="text-muted-foreground">{t("encashmentTable.manualSheetMps")}</div>
                <div className="font-semibold tabular-nums">
                  {formatCurrency(sheetRow.row.mpsTotal, "TRY", { maximumFractionDigits: 2 })}
                </div>
              </div>
              <ul className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
                {sheetRow.workflow.manualAdjustments.length === 0 ? (
                  <li className="text-xs text-muted-foreground">{t("encashmentTable.manualEmpty")}</li>
                ) : (
                  sheetRow.workflow.manualAdjustments.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-start justify-between gap-2 border-b border-border/60 pb-2 text-sm last:border-0"
                    >
                      <div className="min-w-0">
                        <div className="font-medium tabular-nums">
                          {formatCurrency(m.amount, "TRY", { maximumFractionDigits: 2 })}
                        </div>
                        {m.note ? (
                          <div className="text-[11px] text-muted-foreground">{m.note}</div>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        disabled={sheetLocked}
                        onClick={() => onRemoveManualAdjustment(sheetRow.row.id, m.id)}
                        aria-label={t("encashmentTable.manualRemoveAria")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))
                )}
              </ul>
              <div className="space-y-2">
                <Label htmlFor="adj-amt">{t("encashmentTable.manualAmountLabel")}</Label>
                <Input
                  id="adj-amt"
                  type="number"
                  step="0.01"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  placeholder="0.00"
                  className="font-mono tabular-nums"
                  disabled={sheetLocked}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adj-note">{t("encashmentTable.manualNoteLabel")}</Label>
                <Input
                  id="adj-note"
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.target.value)}
                  placeholder={t("encashmentTable.manualNotePh")}
                  disabled={sheetLocked}
                />
              </div>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={submitAdjustment} disabled={sheetLocked}>
              {t("encashmentTable.manualAdd")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
