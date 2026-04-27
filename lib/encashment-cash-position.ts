import type { EncashmentRowData } from "@/lib/data/encashment";

export type EncashmentRouting = "pre_cutoff_bank" | "post_cutoff_safe";

/** Fixed bank / office safe split — not user-configurable in the encashment UI. */
export const BANK_SAFE_CUTOFF = "16:00";

/** Parse "HH:mm" 24h */
export function parseCutoff(cutoff: string): { hours: number; minutes: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(cutoff.trim());
  if (!m) return { hours: 16, minutes: 0 };
  const hours = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const minutes = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return { hours, minutes };
}

/**
 * Same calendar day as `encashmentAt` (local) — compare only time against cutoff.
 */
export function routeEncashment(
  encashmentIso: string,
  cutoff: string
): EncashmentRouting {
  const d = new Date(encashmentIso);
  if (Number.isNaN(d.getTime())) return "post_cutoff_safe";
  const { hours, minutes } = parseCutoff(cutoff);
  const t = d.getHours() * 60 + d.getMinutes();
  const c = hours * 60 + minutes;
  return t < c ? "pre_cutoff_bank" : "post_cutoff_safe";
}

export interface RowWithMeta extends EncashmentRowData {
  routing: EncashmentRouting;
}

export function attachRouting(
  rows: EncashmentRowData[],
  cutoff: string
): RowWithMeta[] {
  return rows.map((r) => ({
    ...r,
    routing: routeEncashment(r.encashmentAt, cutoff),
  }));
}

export interface DailyCashPositionInput {
  openingSafeBalance: number;
  /** Sum of mpsTotal for all rows in the report (today’s encashments). */
  todayEncashmentsGross: number;
  /**
   * Amount approved and designated for same-day bank run (pre-cutoff bucket),
   * after bulk deposit: counts as “bank deposit” for the day.
   */
  sameDayBankDeposit: number;
  /**
   * Sum of mpsTotal for post-cutoff rows (approved) — physically held to office safe same day.
   */
  postCutoffToSafe: number;
  /**
   * Sum of mpsTotal for pre-cutoff (approved) not yet in bank run — still “in flight” for bank.
   * Optional display; 0 if everything pre-cut is either deposited or not approved.
   */
  preCutoffPendingBank: number;
}

/**
 * - Current safe: opening + post-cutoff encashments (staying in office) + any carry not banked
 *   Simplified: currentSafe = opening + postCutoffToSafe (pre-cut money leaves to bank, not in safe)
 * - Grand total: opening + today’s encashment gross (all kiosk collections + carry)
 */
export function computeDailyCashPosition(
  i: DailyCashPositionInput
): {
  openingSafeBalance: number;
  todayEncashments: number;
  sameDayBankDeposit: number;
  postCutoffToSafe: number;
  preCutoffPendingBank: number;
  currentSafeBalance: number;
  grandTotal: number;
} {
  const currentSafeBalance =
    i.openingSafeBalance + i.postCutoffToSafe;
  const grandTotal = i.openingSafeBalance + i.todayEncashmentsGross;
  return {
    openingSafeBalance: i.openingSafeBalance,
    todayEncashments: i.todayEncashmentsGross,
    sameDayBankDeposit: i.sameDayBankDeposit,
    postCutoffToSafe: i.postCutoffToSafe,
    preCutoffPendingBank: i.preCutoffPendingBank,
    currentSafeBalance: Math.round(currentSafeBalance * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}

export function sumMpsTotal(rows: EncashmentRowData[]) {
  return rows.reduce((a, r) => a + r.mpsTotal, 0);
}
