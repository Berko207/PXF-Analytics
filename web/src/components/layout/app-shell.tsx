"use client";

import { SiteNavActive } from "@/components/layout/site-nav";
import { ConnectButton } from "@/components/wallet/connect-button";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 font-bold text-background shadow-lg shadow-amber-500/20">
              PXF
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Analytics
              </p>
              <p className="font-heading text-sm font-semibold">Sonora MMA Intelligence</p>
            </div>
            <Badge variant="outline" className="ml-1 hidden border-amber-500/30 text-amber-400 sm:inline-flex">
              Beta
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <SiteNavActive pathname={pathname} />
            <ConnectButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
