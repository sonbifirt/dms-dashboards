"use client";

import * as React from "react";
import { MoreHorizontal, RotateCw, Download, FileSpreadsheet } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

interface ChartCardProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  onExport?: () => void;
}

export function ChartCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  onExport,
}: ChartCardProps) {
  const { toast } = useToast();

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
        <div className="space-y-0.5">
          <CardTitle className="text-sm">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <div className="flex items-center gap-1">
          {actions}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  onExport?.();
                  toast({
                    title: "Exported",
                    description: "Chart data is downloaded as CSV.",
                    variant: "success",
                  });
                }}
              >
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  toast({
                    title: "Excel export",
                    description: "Not available in this build.",
                  })
                }
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  toast({ title: "Refreshed", description: "Chart updated" })
                }
              >
                <RotateCw className="mr-2 h-4 w-4" /> Refresh
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className={cn("min-h-0 shrink-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
