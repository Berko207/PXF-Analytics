import type { FighterStatus } from "@/types/fight-card";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  FighterStatus,
  { label: string; className: string }
> = {
  matched: {
    label: "Matched",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  suggested: {
    label: "Suggested",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  debut: {
    label: "Debut",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  },
};

interface FighterStatusBadgeProps {
  status: FighterStatus;
  className?: string;
}

export function FighterStatusBadge({ status, className }: FighterStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
