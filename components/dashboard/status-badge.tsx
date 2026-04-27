import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const dotVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
  {
    variants: {
      tone: {
        success: "border-success/25 bg-success/10 text-success",
        warning: "border-warning/25 bg-warning/10 text-warning",
        danger: "border-destructive/25 bg-destructive/10 text-destructive",
        info: "border-info/25 bg-info/10 text-info",
        muted: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { tone: "success" },
  }
);

export function StatusBadge({
  tone,
  children,
  pulse,
  className,
}: { children: React.ReactNode; pulse?: boolean; className?: string } & VariantProps<
  typeof dotVariants
>) {
  return (
    <span className={cn(dotVariants({ tone }), className)}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "success" && "bg-success",
          tone === "warning" && "bg-warning",
          tone === "danger" && "bg-destructive",
          tone === "info" && "bg-info",
          tone === "muted" && "bg-muted-foreground",
          pulse && "animate-pulse"
        )}
      />
      {children}
    </span>
  );
}

export function kioskStatusTone(status: string): "success" | "warning" | "danger" | "muted" | "info" {
  switch (status) {
    case "OK":
      return "success";
    case "Paper Warning":
      return "warning";
    case "Error":
      return "danger";
    case "Disabled":
      return "muted";
    case "Not Found":
      return "info";
    default:
      return "muted";
  }
}
