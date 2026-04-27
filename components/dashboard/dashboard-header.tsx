"use client";

import * as React from "react";
import { DateRangePicker, type PresetId } from "@/components/dashboard/date-range-picker";

interface Props {
  title: string;
  subtitle?: React.ReactNode;
  preset: PresetId;
  onPresetChange: (p: PresetId) => void;
  onRefresh: () => void;
  trailing?: React.ReactNode;
}

export function DashboardHeader({
  title,
  subtitle,
  preset,
  onPresetChange,
  onRefresh,
  trailing,
}: Props) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {trailing}
        <DateRangePicker
          preset={preset}
          onPresetChange={onPresetChange}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  );
}
