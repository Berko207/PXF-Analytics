import { cn } from "@/lib/utils";
import { BarChart3, LayoutDashboard, Swords } from "lucide-react";
import Link from "next/link";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/fight-card", label: "Fight Card", icon: Swords },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

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
    </nav>
  );
}
