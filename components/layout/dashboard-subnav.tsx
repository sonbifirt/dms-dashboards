"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  MonitorSmartphone,
  ShoppingBag,
} from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", labelKey: "subnav.general" as const, icon: Activity, end: true },
  {
    href: "/dashboard/mps",
    labelKey: "subnav.kiosks" as const,
    icon: MonitorSmartphone,
    end: false,
  },
  { href: "/dashboard/psp", labelKey: "subnav.psp" as const, icon: ShoppingBag, end: false },
];

function isTabActive(pathname: string, href: string, end: boolean) {
  if (end) return pathname === href;
  if (href === "/dashboard/mps") {
    if (pathname.startsWith("/dashboard/mps/encashment")) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSubNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  if (pathname.startsWith("/dashboard/mps/encashment")) {
    return null;
  }

  return (
    <div className="mb-5 space-y-3">
      <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab.href, tab.end);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>
      {pathname.startsWith("/dashboard/psp") ? (
        <div className="scrollbar-thin flex flex-wrap gap-2 border-b border-border pb-3">
          <Link
            href="/dashboard/psp"
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              pathname === "/dashboard/psp"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t("subnav.pspOverview")}
          </Link>
          <Link
            href="/dashboard/psp/paypoint-cyprus"
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              pathname.startsWith("/dashboard/psp/paypoint-cyprus") &&
                !pathname.startsWith("/dashboard/psp/paypoint-cyprus/services")
                ? "bg-primary text-primary-foreground"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t("subnav.pspPaypointCyprus")}
          </Link>
          <Link
            href="/dashboard/psp/paypoint-cyprus/services"
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              pathname.startsWith("/dashboard/psp/paypoint-cyprus/services")
                ? "bg-primary text-primary-foreground"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t("subnav.pspPaypointServices")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
