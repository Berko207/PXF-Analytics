import type { BoutLevel } from "@/types/fight-card";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: BoutLevel;
  className?: string;
}

export function LevelBadge({ level, className }: LevelBadgeProps) {
  const isPro = level === "PRO";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        isPro
          ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
          : "border-slate-500/30 bg-slate-500/10 text-slate-300",
        className
      )}
    >
      {level}
    </span>
  );
}
