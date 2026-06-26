import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BarChart3, LayoutDashboard, Lock, Swords, TrendingUp } from "lucide-react";
import Link from "next/link";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/fight-card", label: "Fight Card", icon: Swords },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

const comingSoonItems = [{ label: "Markets", icon: TrendingUp }] as const;

interface SiteNavProps {
  className?: string;
}

export function SiteNav({ className }: SiteNavProps) {
  return (
    <nav className={cn("flex flex-wrap items-center gap-1", className)}>
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function SiteNavActive({
  pathname,
  className,
}: {
  pathname: string;
  className?: string;
}) {
  return (
    <nav className={cn("flex flex-wrap items-center gap-1", className)}>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            data-active={active}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:ring-1 data-[active=true]:ring-primary/20"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
      {comingSoonItems.map(({ label, icon: Icon }) => (
        <span
          key={label}
          title="Prediction markets — coming soon"
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground/50"
        >
          <Icon className="size-4 opacity-60" />
          {label}
          <Badge
            variant="outline"
            className="hidden border-amber-500/20 px-1.5 py-0 text-[9px] uppercase tracking-wide text-amber-400/70 sm:inline-flex"
          >
            Soon
          </Badge>
          <Lock className="size-3 opacity-40" />
        </span>
      ))}
    </nav>
  );
}
