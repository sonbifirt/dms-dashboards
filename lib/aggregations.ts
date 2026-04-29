import { dealers } from "./data/dealers";
import { kiosks } from "./data/kiosks";
import { merchants } from "./data/merchants";
import type { Dealer, Kiosk, Merchant } from "./data/types";

function seeded(i: number) {
  const x = Math.sin(i * 9301.2 + 0.987) * 10000;
  return Math.abs(x - Math.floor(x));
}

export const TOTAL_CASH = kiosks.reduce((a, k) => a + k.cashAmount, 0);
export const TOTAL_CARD = kiosks.reduce((a, k) => a + k.cardAmount, 0);
export const TOTAL_TURNOVER = kiosks.reduce((a, k) => a + k.totalAmount, 0);
export const TOTAL_TX = kiosks.reduce((a, k) => a + k.totalCount, 0);

export const MERCHANT_MONTH_TURNOVER = merchants.reduce(
  (a, m) => a + m.monthTurnover,
  0
);
export const MERCHANT_TODAY_TURNOVER = merchants.reduce(
  (a, m) => a + m.todayTurnover,
  0
);

export const MERCHANT_TX_TOTAL = merchants.reduce((a, m) => a + m.txCount, 0);

export const SYSTEM_TURNOVER = TOTAL_TURNOVER + MERCHANT_MONTH_TURNOVER;

export const KPI = {
  totalTurnover: SYSTEM_TURNOVER,
  mpsCashTurnover: TOTAL_CASH,
  mpsCardTurnover: TOTAL_CARD,
  mpsTurnover: TOTAL_TURNOVER,
  totalTx: TOTAL_TX + MERCHANT_TX_TOTAL,
  dmsTx: TOTAL_TX,
  pspTx: MERCHANT_TX_TOTAL,
  activeDealers: dealers.filter((d) => d.status === "Active").length,
  totalDealers: dealers.length,
  activeKiosks: kiosks.filter((k) => k.status === "OK").length,
  totalKiosks: kiosks.length,
  pspMerchants: merchants.length,
  pspActiveMerchants: merchants.filter((m) => m.status === "Active").length,
  pspTodayTurnover: MERCHANT_TODAY_TURNOVER,
  pspMonthTurnover: MERCHANT_MONTH_TURNOVER,
};

export function topByCity(
  items: Kiosk[],
  by: "totalAmount" | "totalCount" = "totalAmount"
) {
  const map = new Map<string, { city: string; cash: number; card: number; count: number; total: number }>();
  for (const k of items) {
    const row = map.get(k.city) ?? { city: k.city, cash: 0, card: 0, count: 0, total: 0 };
    row.cash += k.cashAmount;
    row.card += k.cardAmount;
    row.count += k.totalCount;
    row.total += k.totalAmount;
    map.set(k.city, row);
  }
  const arr = Array.from(map.values());
  arr.sort((a, b) => (by === "totalAmount" ? b.total - a.total : b.count - a.count));
  return arr;
}

/** City turnover shares for a donut: top N cities, remainder as "Other". */
export function regionKioskShareByCity(topN = 7) {
  const rows = topByCity(kiosks, "totalAmount");
  const top = rows.slice(0, topN);
  const rest = rows.slice(topN);
  const otherTotal = rest.reduce((a, r) => a + r.total, 0);
  const out: { name: string; value: number }[] = top.map((r) => ({
    name: r.city,
    value: r.total,
  }));
  if (otherTotal > 0) {
    out.push({ name: "Other", value: otherTotal });
  }
  return out;
}

export function topKiosks(n = 10, by: "totalAmount" | "totalCount" = "totalAmount") {
  const sorted = [...kiosks].sort((a, b) =>
    by === "totalAmount" ? b.totalAmount - a.totalAmount : b.totalCount - a.totalCount
  );
  return sorted.slice(0, n);
}

export function topDealers(n = 10): Dealer[] {
  return [...dealers].sort((a, b) => b.balance - a.balance).slice(0, n);
}

export function topMerchants(
  n = 10,
  by: "monthTurnover" | "txCount" = "monthTurnover"
): Merchant[] {
  return [...merchants].sort((a, b) =>
    by === "monthTurnover" ? b.monthTurnover - a.monthTurnover : b.txCount - a.txCount
  ).slice(0, n);
}

export function kioskStatusSegment(k: Kiosk): string {
  if (
    k.status === "OK" &&
    (k.paperStatus === "Near end" ||
      (k.statusDetail ?? "").toLowerCase().includes("paper near end"))
  ) {
    return "Paper Warning";
  }
  return k.status;
}

export function kioskStatusBreakdown() {
  const buckets: Record<string, number> = {
    OK: 0,
    "Paper Warning": 0,
    Error: 0,
    Disabled: 0,
    "Not Found": 0,
  };
  for (const k of kiosks) {
    const seg = kioskStatusSegment(k);
    buckets[seg] = (buckets[seg] ?? 0) + 1;
  }
  return Object.entries(buckets)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));
}

export function dealerStatusBreakdown() {
  return [
    { name: "Active", value: dealers.filter((d) => d.status === "Active").length },
    { name: "Inactive", value: dealers.filter((d) => d.status === "Inactive").length },
  ];
}

export function dealerWorkModeBreakdown() {
  return [
    { name: "Production", value: dealers.filter((d) => d.workMode === "Production").length },
    { name: "Test", value: dealers.filter((d) => d.workMode === "Test").length },
  ];
}

export function dealerLocationBreakdown(limit = 10) {
  const map = new Map<string, number>();
  for (const d of dealers) {
    const key = normalizeLocation(d.location);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function normalizeLocation(s: string) {
  const v = s.trim().toUpperCase();
  if (v.includes("LEFKOS")) return "Lefkosa";
  if (v.includes("GIRNE") || v.includes("KYRENIA")) return "Girne";
  if (v.includes("MAGUSA") || v.includes("MAĞUSA") || v.includes("FAMAGUSTA")) return "Magusa";
  if (v.includes("ISKELE")) return "Iskele";
  if (v.includes("GUZELYURT") || v.includes("GÜZELYURT")) return "Guzelyurt";
  if (v.includes("LEFKE")) return "Lefke";
  if (v.includes("CHISINAU")) return "Chisinau";
  if (v.includes("MOLDOVA")) return "Moldova";
  if (v.includes("DOSOFTEI")) return "Moldova";
  if (v.includes("CYPRUS")) return "Cyprus";
  return s;
}

export function merchantCategoryBreakdown() {
  const map = new Map<string, number>();
  for (const m of merchants) {
    map.set(m.category, (map.get(m.category) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function monthlyTurnoverSeries(months = 12) {
  const now = new Date();
  const out: Array<{
    month: string;
    dms: number;
    psp: number;
    total: number;
    cash: number;
    card: number;
  }> = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const label = `${d.toLocaleString("en-US", { month: "short" })} ${String(d.getFullYear()).slice(2)}`;
    const t = (i + 1) / months;
    const wobble = 0.88 + seeded(i + 2) * 0.2;
    const dms = Math.max(
      1,
      Math.round(TOTAL_TURNOVER * t * 0.09 * wobble + (TOTAL_TURNOVER / 24) * seeded(i) * 0.1)
    );
    const psp = Math.max(
      1,
      Math.round(MERCHANT_MONTH_TURNOVER * t * 0.085 * wobble * 0.95)
    );
    const cash = Math.round(dms * (0.12 + seeded(i + 17) * 0.1));
    const card = Math.max(0, dms - cash);
    out.push({ month: label, dms, psp, total: dms + psp, cash, card });
  }
  return out;
}

export function segmentSeries(days = 7) {
  const out: Array<{ day: string; dms: number; psp: number }> = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const wd = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = d.getDate();
    const label = `${wd} ${dayNum}`;
    const s = 0.55 + seeded(i * 3 + 2) * 0.9;
    out.push({
      day: label,
      dms: Math.round((TOTAL_TURNOVER / 30) * s),
      psp: Math.round((MERCHANT_MONTH_TURNOVER / 30) * s * 0.9),
    });
  }
  return out;
}

export function kioskGroupedByDealer() {
  const map = new Map<
    number,
    { dealerId: number; dealerName: string; kioskCount: number; turnover: number; tx: number }
  >();
  for (const k of kiosks) {
    const id = k.dealerId ?? 0;
    const dealerName = dealers.find((d) => d.id === id)?.name ?? "Unassigned";
    const row =
      map.get(id) ?? { dealerId: id, dealerName, kioskCount: 0, turnover: 0, tx: 0 };
    row.kioskCount += 1;
    row.turnover += k.totalAmount;
    row.tx += k.totalCount;
    map.set(id, row);
  }
  return Array.from(map.values()).sort((a, b) => b.turnover - a.turnover);
}
