import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  currency = "TRY",
  opts: Intl.NumberFormatOptions = {}
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    ...opts,
  }).format(value);
}

export function formatNumber(value: number, opts: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, ...opts }).format(
    value
  );
}

export function formatCompact(value: number, currency?: string) {
  const formatted = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
  return currency ? `${formatted} ${currency}` : formatted;
}

export function percent(value: number, total: number, digits = 1) {
  if (!total) return "0%";
  return `${((value / total) * 100).toFixed(digits)}%`;
}
