"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { CountUp } from "@/components/dashboard/count-up";
import { Card } from "@/components/ui/card";

type Tone = "default" | "success" | "warning" | "danger" | "info" | "brand";

const TONES: Record<Tone, { badge: string; bar: string; text: string }> = {
  default: { badge: "bg-muted text-muted-foreground", bar: "bg-muted-foreground/30", text: "text-foreground" },
  success: { badge: "bg-success/15 text-success", bar: "bg-success/70", text: "text-foreground" },
  warning: { badge: "bg-warning/15 text-warning", bar: "bg-warning/70", text: "text-foreground" },
  danger: { badge: "bg-destructive/15 text-destructive", bar: "bg-destructive/70", text: "text-foreground" },
  info: { badge: "bg-info/15 text-info", bar: "bg-info/70", text: "text-foreground" },
  brand: { badge: "bg-primary/15 text-primary", bar: "bg-primary/80", text: "text-foreground" },
};

interface KpiCardProps {
  label: string;
  value: number;
  format?: (v: number) => string;
  icon?: LucideIcon;
  delta?: { value: number; label?: string };
  sub?: React.ReactNode;
  tone?: Tone;
  onClick?: () => void;
  active?: boolean;
}

export function KpiCard({
  label,
  value,
  format,
  icon: Icon,
  delta,
  sub,
  tone = "default",
  onClick,
  active,
}: KpiCardProps) {
  const palette = TONES[tone];
  const isClickable = Boolean(onClick);
  const up = delta && delta.value >= 0;

  return (
    <Card
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative min-w-0 p-5 transition-all",
        isClickable && "cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover",
        active && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-0.5", palette.bar)} />

      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className="line-clamp-2 min-w-0 break-words text-xs font-medium text-muted-foreground">
          {label}
        </span>
        {Icon ? (
          <span
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
              palette.badge
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-3 min-w-0 w-full font-semibold tabular-nums leading-tight tracking-tight text-[clamp(0.8125rem,0.2rem+1.45vw,1.5625rem)]",
          palette.text
        )}
      >
        <CountUp value={value} format={format} />
      </div>

      <div className="mt-2 flex items-start justify-between gap-2 text-[11px]">
        <div className="min-w-0 whitespace-pre-line text-muted-foreground leading-snug">
          {sub}
        </div>
        {delta ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
              up
                ? "bg-success/12 text-success"
                : "bg-destructive/12 text-destructive"
            )}
          >
            {up ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(delta.value).toFixed(1)}%
            {delta.label ? (
              <span className="ml-0.5 font-normal opacity-75">{delta.label}</span>
            ) : null}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
