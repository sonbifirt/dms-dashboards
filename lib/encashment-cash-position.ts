import type { EncashmentRowData } from "@/lib/data/encashment";

/** Single routing bucket — no time-based cutoff in the encashment UI. */
export type EncashmentRouting = "standard";

export interface RowWithMeta extends EncashmentRowData {
  routing: EncashmentRouting;
}

export function attachRouting(rows: EncashmentRowData[]): RowWithMeta[] {
  return rows.map((r) => ({
    ...r,
    routing: "standard" as const,
  }));
}

export interface DailyCashPositionLedgerInput {
  openingSafeBalance: number;
  /** Sum of MPS totals for rows in the report. */
  todayEncashmentsGross: number;
  /** Sum of manual review adjustments across rows. */
  manualAdjustmentsTotal: number;
  /** Total recorded bank deposits from table ledger (confirmed lines). */
  bankDepositsTotal: number;
  /** Cash physically added to office safe (manual). */
  safeAddsTotal: number;
  /** Amount moved from office safe to bank (ledger). */
  safeToBankTotal: number;
}

/**
 * Current safe = opening + manual safe adds − transfers from safe to bank.
 * Grand total = opening + today's gross encashments + manual adjustments (for reconciliation view).
 */
export function computeDailyCashPositionLedger(i: DailyCashPositionLedgerInput): {
  openingSafeBalance: number;
  todayEncashments: number;
  manualAdjustmentsTotal: number;
  bankDepositsTotal: number;
  safeAddsTotal: number;
  safeToBankTotal: number;
  currentSafeBalance: number;
  grandTotal: number;
} {
  const currentSafeBalance =
    i.openingSafeBalance + i.safeAddsTotal - i.safeToBankTotal;
  const grandTotal =
    i.openingSafeBalance + i.todayEncashmentsGross + i.manualAdjustmentsTotal;
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    openingSafeBalance: round2(i.openingSafeBalance),
    todayEncashments: round2(i.todayEncashmentsGross),
    manualAdjustmentsTotal: round2(i.manualAdjustmentsTotal),
    bankDepositsTotal: round2(i.bankDepositsTotal),
    safeAddsTotal: round2(i.safeAddsTotal),
    safeToBankTotal: round2(i.safeToBankTotal),
    currentSafeBalance: round2(currentSafeBalance),
    grandTotal: round2(grandTotal),
  };
}

export function sumMpsTotal(rows: EncashmentRowData[]) {
  return rows.reduce((a, r) => a + r.mpsTotal, 0);
}
