import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: "default" | "red" | "blue" | "amber" | "emerald";
}

const accentStyles = {
  default: "text-foreground",
  red: "text-red-400",
  blue: "text-blue-400",
  amber: "text-amber-400",
  emerald: "text-emerald-400",
};

export function StatCard({ label, value, hint, icon: Icon, accent = "default" }: StatCardProps) {
  return (
    <Card className="group overflow-hidden transition-all hover:ring-amber-500/20">
      <CardContent className="flex items-start justify-between gap-3 pt-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className={cn("mt-1 text-3xl font-semibold tabular-nums", accentStyles[accent])}>
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="rounded-lg bg-muted/50 p-2 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
