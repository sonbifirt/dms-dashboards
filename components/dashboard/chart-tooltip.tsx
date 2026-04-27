"use client";

import * as React from "react";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Payload {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

interface Props {
  active?: boolean;
  payload?: Payload[];
  label?: string | number;
  valueFormatter?: (v: number) => string;
  labelFormatter?: (l: string | number | undefined) => React.ReactNode;
  suffix?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
  suffix,
}: Props) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover/95 p-2.5 text-xs shadow-lg backdrop-blur">
      {label !== undefined ? (
        <div className="mb-1.5 font-semibold text-foreground">
          {labelFormatter ? labelFormatter(label) : String(label)}
        </div>
      ) : null}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-muted-foreground">{p.name ?? p.dataKey}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">
              {p.value !== undefined
                ? valueFormatter
                  ? valueFormatter(p.value)
                  : formatNumber(p.value)
                : "—"}
              {suffix ? <span className="ml-0.5 opacity-60">{suffix}</span> : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const currencyFormatter = (v: number) =>
  formatCurrency(v, "TRY", { maximumFractionDigits: 0 });
export const compactCurrencyFormatter = (v: number) =>
  `${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(v)} ₺`;
