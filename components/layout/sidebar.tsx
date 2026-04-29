"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  MonitorSmartphone,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  Receipt,
} from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { cn, formatCurrency } from "@/lib/utils";

type NavChild = {
  labelKey: "nav.general" | "nav.kiosks" | "nav.psp";
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavItem =
  | {
      type: "group";
      id: "dashboards";
      labelKey: "nav.groupDashboards";
      icon: React.ComponentType<{ className?: string }>;
      children: NavChild[];
    }
  | {
      type: "link";
      labelKey: "nav.encashment";
      href: string;
      icon: React.ComponentType<{ className?: string }>;
    };

const navItems: NavItem[] = [
  {
    type: "group",
    id: "dashboards",
    labelKey: "nav.groupDashboards",
    icon: LayoutDashboard,
    children: [
      { labelKey: "nav.general", href: "/dashboard", icon: Activity },
      { labelKey: "nav.kiosks", href: "/dashboard/mps", icon: MonitorSmartphone },
      { labelKey: "nav.psp", href: "/dashboard/psp", icon: ShoppingBag },
    ],
  },
  {
    type: "link",
    labelKey: "nav.encashment",
    href: "/dashboard/mps/encashment",
    icon: Receipt,
  },
];

function isChildActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/mps") {
    if (pathname.startsWith("/dashboard/mps/encashment")) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isGroupActive(pathname: string, children: NavChild[]) {
  return children.some((c) => isChildActive(pathname, c.href));
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    dashboards: true,
  });

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-bold text-[13px] text-primary-foreground shadow-lg shadow-primary/20">
          PP
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-wide">
            PayPoint<span className="text-primary"> {t("sidebar.brandDms")}</span>
          </div>
          <div className="text-[11px] text-sidebar-foreground/60">
            {t("sidebar.tagline")}
          </div>
        </div>
      </div>

      <div className="mx-4 mb-3 rounded-lg border border-sidebar-border/60 bg-sidebar-hover/60 p-3">
        <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
          {t("sidebar.activeDealer")}
        </div>
        <div className="mt-1 text-sm font-semibold text-sidebar-foreground">
          {t("sidebar.rootDealerName")}
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[11px] text-sidebar-foreground/70">
          <span>{t("sidebar.loginLabel")}</span>
          <span className="font-semibold text-primary">
            {formatCurrency(6290000.54, "TRY", { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      <div className="px-4 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/45">
        {t("sidebar.mainMenu")}
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            if (item.type === "group") {
              const open = openGroups[item.id] ?? isGroupActive(pathname, item.children);
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenGroups((s) => ({ ...s, [item.id]: !open }))
                    }
                    className={cn(
                      "group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      "hover:bg-sidebar-hover",
                      isGroupActive(pathname, item.children)
                        ? "bg-sidebar-hover text-white"
                        : "text-sidebar-foreground/85"
                    )}
                  >
                    {Icon ? <Icon className="h-4 w-4 opacity-80" /> : null}
                    <span className="flex-1 text-left">{t(item.labelKey)}</span>
                    {open ? (
                      <ChevronDown className="h-4 w-4 opacity-60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                  </button>
                  {open ? (
                    <ul className="mt-0.5 space-y-0.5 pl-2">
                      {item.children.map((child) => {
                        const active = isChildActive(pathname, child.href);
                        const CIcon = child.icon;
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={onNavigate}
                              className={cn(
                                "group relative ml-3 flex items-center gap-2 rounded-md py-1.5 pl-3 pr-3 text-[13px] transition-colors",
                                active
                                  ? "bg-primary/15 text-white"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-white"
                              )}
                            >
                              <span
                                className={cn(
                                  "absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full transition-all",
                                  active ? "bg-primary" : "bg-transparent"
                                )}
                              />
                              <CIcon
                                className={cn(
                                  "h-3.5 w-3.5",
                                  active
                                    ? "text-primary"
                                    : "text-sidebar-foreground/50"
                                )}
                              />
                              <span className="flex-1">{t(child.labelKey)}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            }

            const encActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const LinkIcon = item.icon;
            return (
              <li key={item.href} className="pt-2">
                <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
                  {t("nav.operations")}
                </div>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    encActive
                      ? "bg-sidebar-hover text-white"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-white"
                  )}
                >
                  <LinkIcon
                    className={cn(
                      "h-4 w-4",
                      encActive ? "text-primary" : "opacity-80"
                    )}
                  />
                  <span className="flex-1">{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border/70 p-3 text-[11px] text-sidebar-foreground/50">
        {t("sidebar.footer", { year: new Date().getFullYear() })}
      </div>
    </aside>
  );
}
