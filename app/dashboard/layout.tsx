import { AppShell } from "@/components/layout/app-shell";
import { DashboardSubNav } from "@/components/layout/dashboard-subnav";
import { LocaleProvider } from "@/lib/i18n/locale-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider>
      <AppShell>
        <div className="p-4 md:p-6 lg:p-8 lg:pt-6">
          <DashboardSubNav />
          {children}
        </div>
      </AppShell>
    </LocaleProvider>
  );
}
