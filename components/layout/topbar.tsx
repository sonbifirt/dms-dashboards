"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Globe,
  HelpCircle,
  LogOut,
  Menu,
  Settings,
  User,
} from "lucide-react";

import { useI18n, type AppLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const LANGS: { id: AppLocale; labelKey: "topbar.langEnglish" | "topbar.langTurkish" | "topbar.langRussian" | "topbar.langRomanian"; code: string }[] = [
  { id: "en", labelKey: "topbar.langEnglish", code: "EN" },
  { id: "tr", labelKey: "topbar.langTurkish", code: "TR" },
  { id: "ru", labelKey: "topbar.langRussian", code: "RU" },
  { id: "ro", labelKey: "topbar.langRomanian", code: "RO" },
];

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const { t, locale, setLocale } = useI18n();

  const title = React.useMemo(() => {
    if (pathname.startsWith("/dashboard/mps/encashment")) {
      return t("topbar.titleEncashment");
    }
    const map: Record<string, "topbar.titleGeneral" | "topbar.titleKiosks" | "topbar.titlePsp" | "topbar.titleDealers"> = {
      "/dashboard": "topbar.titleGeneral",
      "/dashboard/mps": "topbar.titleKiosks",
      "/dashboard/psp": "topbar.titlePsp",
      "/dashboard/dealers": "topbar.titleDealers",
    };
    const k = map[pathname];
    return k ? t(k) : t("topbar.fallbackTitle");
  }, [pathname, t]);

  const badge = LANGS.find((l) => l.id === locale)?.code ?? "EN";

  const notifs: {
    title: "topbar.notif1" | "topbar.notif2" | "topbar.notif3" | "topbar.notif4";
    time: "topbar.notif1time" | "topbar.notif2time" | "topbar.notif3time" | "topbar.notif4time";
    kind: "error" | "warn" | "ok";
  }[] = [
    { title: "topbar.notif1", time: "topbar.notif1time", kind: "error" },
    { title: "topbar.notif2", time: "topbar.notif2time", kind: "error" },
    { title: "topbar.notif3", time: "topbar.notif3time", kind: "warn" },
    { title: "topbar.notif4", time: "topbar.notif4time", kind: "ok" },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMenu}
        aria-label={t("topbar.openMenu")}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <nav className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard"
          className="hover:text-foreground transition-colors"
        >
          {t("topbar.home")}
        </Link>
        <span className="text-border">/</span>
        <span className="font-medium text-foreground truncate">{title}</span>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="hidden gap-1 sm:inline-flex">
              <Globe className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase">{badge}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("topbar.language")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {LANGS.map((l) => (
              <DropdownMenuItem
                key={l.id}
                className={cn(l.id === locale && "bg-accent")}
                onSelect={() => setLocale(l.id)}
              >
                {t(l.labelKey)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("topbar.ariaNotifications")}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>{t("topbar.notifications")}</span>
              <Badge variant="outline" className="text-[10px]">
                {t("topbar.notificationsNew")}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifs.map((n) => (
              <DropdownMenuItem key={n.title} className="py-2">
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-1 h-2 w-2 shrink-0 rounded-full",
                      n.kind === "error" && "bg-destructive",
                      n.kind === "warn" && "bg-warning",
                      n.kind === "ok" && "bg-success"
                    )}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {t(n.title)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t(n.time)}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/15 text-primary">
                  {t("topbar.userInitials")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left leading-tight sm:block">
                <div className="text-[13px] font-semibold">{t("topbar.userName")}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t("topbar.systemAdmin")}
                </div>
              </div>
              <ChevronDown className="hidden h-3 w-3 opacity-60 sm:inline-block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t("topbar.myAccount")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" /> {t("topbar.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" /> {t("topbar.settings")}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" /> {t("topbar.helpCenter")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> {t("topbar.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
