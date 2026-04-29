import { monthlyTurnoverSeries } from "@/lib/aggregations";

export type OwnProductId = "adakart" | "kartbuy" | "paypointCyprus";

/** Approximate share of PSP turnover in the synthetic series. */
const SHARE_OF_PSP: Record<OwnProductId, number> = {
  adakart: 0.24,
  kartbuy: 0.19,
  paypointCyprus: 0.32,
};

function wobble(id: OwnProductId, salt: number): number {
  let h = 0;
  const s = `${id}-${salt}`;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return 0.9 + Math.abs(Math.sin(h * 0.001)) * 0.2;
}

export function ownProductMonthlyTrend(id: OwnProductId, months = 12) {
  const series = monthlyTurnoverSeries(months);
  const share = SHARE_OF_PSP[id];
  return series.map((row, i) => ({
    month: row.month,
    amount: Math.max(0, Math.round(row.psp * share * wobble(id, i))),
  }));
}

export function ownProductSnapshot(id: OwnProductId) {
  const trend = ownProductMonthlyTrend(id, 12);
  const monthAmount = trend[trend.length - 1]?.amount ?? 0;
  const prevAmount = trend[trend.length - 2]?.amount ?? monthAmount;
  const momPct = prevAmount > 0 ? ((monthAmount - prevAmount) / prevAmount) * 100 : 0;
  const ticket =
    id === "adakart" ? 4200 : id === "kartbuy" ? 6800 : 3900;
  const monthTx = Math.max(8, Math.round(monthAmount / ticket));
  return { monthAmount, monthTx, momPct };
}

/** Synthetic cash share for illustrations (aligned with kiosk-style cash vs card charts). */
const CASH_SHARE: Record<OwnProductId, number> = {
  adakart: 0.44,
  kartbuy: 0.31,
  paypointCyprus: 0.52,
};

export function ownProductCashCardAmounts(id: OwnProductId): {
  cashAmount: number;
  cardAmount: number;
  totalAmount: number;
  cashPct: number;
} {
  const { monthAmount } = ownProductSnapshot(id);
  const cashAmount = Math.round(monthAmount * CASH_SHARE[id]);
  const cardAmount = monthAmount - cashAmount;
  const totalAmount = monthAmount;
  const cashPct =
    totalAmount > 0 ? (cashAmount / totalAmount) * 100 : 0;
  return { cashAmount, cardAmount, totalAmount, cashPct };
}

export const OWN_PRODUCT_DAILY_CHART_MAX_DAYS = 90;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysInclusive(a: Date, b: Date): number {
  const start = startOfDay(a);
  const end = startOfDay(b);
  if (end < start) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

/** Inclusive range; splits product cash/card month totals across days (illustrative). */
export function ownProductDailyCashCardSeries(
  id: OwnProductId,
  rangeStart: Date,
  rangeEnd: Date
): { day: string; cash: number; card: number }[] {
  const { cashAmount, cardAmount } = ownProductCashCardAmounts(id);
  const start = startOfDay(rangeStart);
  const end = startOfDay(rangeEnd);
  if (end < start) return [];
  let days = daysInclusive(start, end);
  if (days < 1) return [];
  if (days > OWN_PRODUCT_DAILY_CHART_MAX_DAYS) {
    days = OWN_PRODUCT_DAILY_CHART_MAX_DAYS;
  }
  const weights: number[] = [];
  for (let i = 0; i < days; i++) {
    let h = 0;
    const seed = `${id}-${i}-${start.getTime()}`;
    for (let j = 0; j < seed.length; j++) {
      h = (h * 31 + seed.charCodeAt(j)) | 0;
    }
    weights.push(0.35 + Math.abs(Math.sin(h * 0.001)) * 0.9);
  }
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const rows = weights.map((w, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const wd = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = d.getDate();
    const mon = d.getMonth() + 1;
    return {
      day: `${wd} ${dayNum}/${mon}`,
      cash: Math.round((cashAmount * w) / sum),
      card: Math.round((cardAmount * w) / sum),
    };
  });
  const cashSum = rows.reduce((a, r) => a + r.cash, 0);
  const cardSum = rows.reduce((a, r) => a + r.card, 0);
  if (rows.length) {
    rows[rows.length - 1].cash += cashAmount - cashSum;
    rows[rows.length - 1].card += cardAmount - cardSum;
  }
  return rows;
}
