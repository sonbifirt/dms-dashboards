"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Option<T extends string> {
  id: T;
  label: React.ReactNode;
}

interface SegmentToggleProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  size?: "sm" | "md";
  className?: string;
}

export function SegmentToggle<T extends string>({
  value,
  onChange,
  options,
  size = "sm",
  className,
}: SegmentToggleProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-muted/60 p-0.5",
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            "rounded-[5px] px-2.5 font-medium transition-all",
            size === "sm" ? "h-7 text-xs" : "h-8 text-sm",
            value === opt.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
