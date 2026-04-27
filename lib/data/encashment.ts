import { kiosks } from "./kiosks";
import type { Kiosk } from "./types";

/** Demo “logged-in” accountant for audit log entries. */
export const DEMO_ACCOUNTANT = {
  userId: "acc-demo-1",
  displayName: "Demo Accountant",
} as const;

export interface EncashmentReportParams {
  /** `undefined` = all kiosks */
  dealerId?: number;
  from: Date;
  to: Date;
  /** Cap rows for UI performance in demo (default 60). */
  maxRows?: number;
}

/**
 * One encashment line matching the MPS report (kiosk id, time, banknotes / card / totals, MPS vs kiosk).
 * Workflow fields (review, approve) live in the demo store overlay.
 */
export interface EncashmentRowData {
  id: string;
  kioskId: string;
  /** ISO 8601 */
  encashmentAt: string;
  banknoteQt: number;
  banknoteAmount: number;
  cardQt: number;
  cardAmount: number;
  totalQt: number;
  mpsTotal: number;
  kioskTotal: number;
  difference: number;
  /** True if |difference| is above a small threshold — may auto-suggest exception */
  hasNumericMismatch: boolean;
  dealerId?: number;
}

function inRange(t: number, from: number, to: number) {
  return t >= from && t <= to;
}

function buildRow(
  k: Kiosk,
  at: Date,
  injectMismatch: boolean
): EncashmentRowData {
  const banknoteQt = k.cashCount;
  const banknoteAmount = k.cashAmount;
  const cardQt = k.cardCount;
  const cardAmount = k.cardAmount;
  const totalQt = k.totalCount;
  const mpsTotal = k.totalAmount;
  let kioskTotal = mpsTotal;
  if (injectMismatch) {
    kioskTotal = Math.round((mpsTotal - 2.5) * 100) / 100;
  }
  const difference = Math.round((mpsTotal - kioskTotal) * 100) / 100;
  const hasNumericMismatch = Math.abs(difference) > 0.01;
  return {
    id: `${k.id}__${at.toISOString()}`,
    kioskId: k.id,
    encashmentAt: at.toISOString(),
    banknoteQt,
    banknoteAmount,
    cardQt,
    cardAmount,
    totalQt,
    mpsTotal,
    kioskTotal,
    difference,
    hasNumericMismatch,
    dealerId: k.dealerId,
  };
}

/**
 * Seeded from live kiosk data: one encashment per kiosk in window, with times spread in the day.
 * A subset of kiosks gets a small MPS vs kiosk mismatch for exception demos.
 */
export function generateEncashmentReport(
  params: EncashmentReportParams
): EncashmentRowData[] {
  const fromT = params.from.getTime();
  const toT = params.to.getTime();
  if (!Number.isFinite(fromT) || !Number.isFinite(toT) || fromT > toT) {
    return [];
  }

  let list = kiosks.filter(
    (k) => k.totalAmount > 0 || k.totalCount > 0 || k.cashCount > 0
  );
  if (params.dealerId != null) {
    list = list.filter((k) => k.dealerId === params.dealerId);
  }

  const out: EncashmentRowData[] = [];
  const cap = params.maxRows ?? 60;
  /** Reserve rows for fixed post-16:00 demo lines (kiosk + banknote examples). */
  const reservePostDemo = 3;
  const loopCap = Math.max(0, cap - reservePostDemo);
  let i = 0;
  for (const k of list) {
    if (out.length >= loopCap) break;
    const dayBase = fromT;
    const span = Math.max(0, toT - fromT);
    const phase = (i * 0.17) % 1;
    const offset = span * phase;
    const h = 8 + ((i * 3) % 9);
    const m = (i * 7) % 60;
    const s = (i * 11) % 60;
    const at = new Date(dayBase + offset);
    at.setHours(h, m, s, 0);
    if (!inRange(at.getTime(), fromT, toT)) {
      at.setTime(Math.min(toT, Math.max(fromT, at.getTime())));
    }
    const injectMismatch = i % 17 === 5 || i % 23 === 7;
    out.push(buildRow(k, at, injectMismatch));
    i += 1;
  }

  // Demo: encashments after 16:00 (same day as range start) so the post-cutoff table shows real kiosks + banknotes
  const POST_DEMO_KIOSK_IDS = ["20001004", "70001001", "30001009"] as const;
  for (let j = 0; j < POST_DEMO_KIOSK_IDS.length; j++) {
    if (out.length >= cap) break;
    const id = POST_DEMO_KIOSK_IDS[j];
    const k = kiosks.find((x) => x.id === id);
    if (!k) continue;
    if (params.dealerId != null && k.dealerId !== params.dealerId) continue;
    const at = new Date(fromT);
    at.setHours(16, 5 + j * 22, 0, 0);
    if (at.getTime() < fromT) at.setTime(fromT);
    if (at.getTime() > toT) at.setTime(toT);
    if (!inRange(at.getTime(), fromT, toT)) continue;
    const tMin = at.getHours() * 60 + at.getMinutes();
    if (tMin < 16 * 60) {
      at.setHours(16, 10 + j * 5, 0, 0);
      if (at.getTime() > toT) at.setTime(toT);
    }
    if (!inRange(at.getTime(), fromT, toT)) continue;
    if (at.getHours() * 60 + at.getMinutes() < 16 * 60) continue;
    out.push(buildRow(k, at, false));
  }

  return out.sort(
    (a, b) =>
      new Date(a.encashmentAt).getTime() - new Date(b.encashmentAt).getTime()
  );
}

export function reportKey(
  dealerId: number | "all",
  fromIso: string,
  toIso: string
) {
  return `${dealerId}|${fromIso}|${toIso}`;
}
