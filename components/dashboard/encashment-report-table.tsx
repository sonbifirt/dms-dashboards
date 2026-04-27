"use client";

import * as React from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
} from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type { EncashmentRowData } from "@/lib/data/encashment";
import type { EncashmentRouting } from "@/lib/encashment-cash-position";
import type { EncashmentRowWorkflow } from "@/lib/encashment-demo-store";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  t,
}: {
  w: EncashmentRowView["workflow"];
  row: EncashmentRowData;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}) {
  if (w.deposited) {
    return <StatusBadge tone="success">{t("encashmentTable.statusDeposited")}</StatusBadge>;
  }
  if (w.routing === "post_cutoff_safe" && w.approved) {
    return <StatusBadge tone="warning">{t("encashmentTable.statusInSafe")}</StatusBadge>;
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

const CONTROL_COLS = 5;

interface EncashmentReportTableProps {
  items: EncashmentRowView[];
  /** pre: same-day bank batch; post: office safe after cutoff. */
  mode: "pre" | "post";
  onToggleReview: (rowId: string) => void;
  onApprove: (rowId: string) => void;
  onToggleException: (rowId: string, value: boolean) => void;
}

export function EncashmentReportTable({
  items,
  mode,
  onToggleReview,
  onApprove,
  onToggleException,
}: EncashmentReportTableProps) {
  const { t, dateLocale } = useI18n();
  const [openLogId, setOpenLogId] = React.useState<string | null>(null);

  const totals = React.useMemo(() => {
    let banknoteQt = 0;
    let banknoteAmt = 0;
    let cardQt = 0;
    let cardAmt = 0;
    let totQt = 0;
    let mps = 0;
    let kiosk = 0;
    let diff = 0;
    for (const { row } of items) {
      banknoteQt += row.banknoteQt;
      banknoteAmt += row.banknoteAmount;
      cardQt += row.cardQt;
      cardAmt += row.cardAmount;
      totQt += row.totalQt;
      mps += row.mpsTotal;
      kiosk += row.kioskTotal;
      diff += row.difference;
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
    };
  }, [items]);

  const colSpanFull = 10 + CONTROL_COLS;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="scrollbar-thin overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[1020px] border-collapse text-sm">
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
              <th className="border-b px-1 py-1.5 text-left">{t("encashmentTable.status")}</th>
              <th className="border-b px-1 py-1.5 text-center">{t("encashmentTable.approve")}</th>
              <th className="border-b px-1 py-1.5 text-center">{t("encashmentTable.exc")}</th>
              <th className="border-b px-1 py-1.5 text-center">{t("encashmentTable.log")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ row, workflow: w }) => {
              const expanded = openLogId === row.id;
              const canApprove = !w.approved && !w.deposited;
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
                      {formatCurrency(row.mpsTotal, "TRY", {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-1 py-1.5 text-right tabular-nums">
                      {formatCurrency(row.kioskTotal, "TRY", {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className={cn(
                        "border-r px-1 py-1.5 text-right tabular-nums",
                        Math.abs(row.difference) > 0.01
                          ? "text-destructive"
                          : ""
                      )}
                    >
                      {formatCurrency(row.difference, "TRY", {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <Checkbox
                              checked={w.reviewed}
                              onCheckedChange={() => onToggleReview(row.id)}
                              disabled={w.deposited || w.approved}
                              aria-label={t("encashmentTable.reviewedAria")}
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px] text-xs">
                          {w.approved
                            ? t("encashmentTable.ttReviewLockedApproved")
                            : w.deposited
                              ? t("encashmentTable.ttReviewLockedDeposit")
                              : t("encashmentTable.ttReviewHint")}
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="px-1 py-1.5">
                      <RowStatusBadge w={w} row={row} t={t} />
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-7 px-2 text-[10px]"
                              disabled={!canApprove}
                              onClick={() => onApprove(row.id)}
                            >
                              {w.approved
                                ? t("encashmentTable.approveDone")
                                : t("encashmentTable.approveBtn")}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px] text-xs">
                          {w.approved
                            ? t("encashmentTable.ttApproved")
                            : w.deposited
                              ? t("encashmentTable.ttInBatch")
                              : w.routing === "post_cutoff_safe"
                                ? t("encashmentTable.ttApproveSafe")
                                : t("encashmentTable.ttApproveBank")}
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
                              disabled={w.deposited}
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
                    <td className="px-1 py-1.5 text-center">
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
                {formatCurrency(totals.mps, "TRY", { maximumFractionDigits: 2 })}
              </td>
              <td className="border-t px-1 py-2 text-right tabular-nums">
                {formatCurrency(totals.kiosk, "TRY", { maximumFractionDigits: 2 })}
              </td>
              <td className="border-t border-r px-1 py-2 text-right tabular-nums">
                {formatCurrency(totals.diff, "TRY", { maximumFractionDigits: 2 })}
              </td>
              <td
                colSpan={CONTROL_COLS}
                className="border-t px-2 py-2 text-muted-foreground"
              >
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  {t("encashmentTable.footerCount", { n: items.length })}
                  {mode === "pre"
                    ? t("encashmentTable.footerPreSuffix")
                    : t("encashmentTable.footerPostSuffix")}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </TooltipProvider>
  );
}
