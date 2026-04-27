"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { MessageKey } from "@/lib/i18n/messages/en";

export type PresetId = "today" | "week" | "month";

const PRESET_IDS: { id: PresetId; labelKey: MessageKey; days: number }[] = [
  { id: "today", labelKey: "dateRange.today", days: 1 },
  { id: "week", labelKey: "dateRange.week", days: 7 },
  { id: "month", labelKey: "dateRange.month", days: 30 },
];

export function DateRangePicker({
  preset = "month",
  onPresetChange,
  onRefresh,
  className,
}: {
  preset?: PresetId;
  onPresetChange?: (id: PresetId) => void;
  onRefresh?: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [spinning, setSpinning] = React.useState(false);

  function handleRefresh() {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 650);
    onRefresh?.();
    toast({
      title: t("dateRange.toastTitle"),
      description: t("dateRange.toastDesc"),
      variant: "success",
    });
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
        {PRESET_IDS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPresetChange?.(p.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              preset === p.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(p.labelKey)}
          </button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        className="gap-1.5"
        type="button"
      >
        <RefreshCw
          className={cn("h-3.5 w-3.5", spinning && "animate-spin text-primary")}
        />
        {t("dateRange.refresh")}
      </Button>
    </div>
  );
}
