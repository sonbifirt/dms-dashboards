import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { Toaster } from "@/components/ui/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/layout/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PayPoint DMS — Dashboards",
  description:
    "Dealer Management System dashboards for PayPoint — Kiosks, PSP, Dealers & System overview.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          <TooltipProvider delayDuration={150}>
            <Toaster>{children}</Toaster>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
