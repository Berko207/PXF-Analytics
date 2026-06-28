import { Badge } from "@/components/ui/badge";
import { confidenceLabel } from "@/lib/ratings";
import type { MarketStatus, PredictionFactor } from "@/types/fight-card";

/** Colored badge conveying how much to trust the model's pick. */
export function ConfidenceBadge({ confidence }: { confidence?: number }) {
  if (confidence == null) return null;
  const band = confidenceLabel(confidence);
  const cls =
    band === "high"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : band === "medium"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-zinc-500/30 bg-zinc-500/10 text-zinc-300";
  return (
    <Badge
      variant="outline"
      className={`${cls} text-[10px] uppercase tracking-wide`}
      title="Model confidence = data quality × decisiveness"
    >
      {band} conf · {confidence}
    </Badge>
  );
}

/** Top drivers behind the prediction, with the corner each favors. */
export function FactorList({
  factors,
  redName,
  blueName,
  max = 3,
}: {
  factors?: PredictionFactor[];
  redName: string;
  blueName: string;
  max?: number;
}) {
  if (!factors || factors.length === 0) return null;
  const shown = factors.slice(0, max);
  return (
    <ul className="space-y-1">
      {shown.map((f) => {
        const favorsRed = f.impact >= 0;
        const who = favorsRed ? redName : blueName;
        const color = favorsRed ? "text-red-400" : "text-blue-400";
        return (
          <li key={f.label} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-muted-foreground">{f.label}</span>
            <span className={`font-mono ${color}`}>
              {favorsRed ? "+" : ""}
              {f.impact} {who}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const MARKET_LABELS: Record<MarketStatus, { label: string; cls: string }> = {
  pending: { label: "Market: prep", cls: "border-zinc-500/30 text-zinc-400" },
  created: { label: "Market: prepared", cls: "border-amber-500/30 text-amber-300" },
  trading_open: { label: "Market: live", cls: "border-emerald-500/30 text-emerald-300" },
  closed: { label: "Market: closed", cls: "border-zinc-500/30 text-zinc-400" },
  resolved: { label: "Market: resolved", cls: "border-blue-500/30 text-blue-300" },
  settled: { label: "Market: settled", cls: "border-emerald-500/30 text-emerald-300" },
  cancelled: { label: "Market: cancelled", cls: "border-red-500/30 text-red-300" },
};

/** Per-bout prediction-market readiness chip. */
export function MarketStatusChip({ status }: { status: MarketStatus }) {
  const { label, cls } = MARKET_LABELS[status] ?? MARKET_LABELS.pending;
  return (
    <Badge variant="outline" className={`${cls} text-[10px] uppercase tracking-wide`}>
      {label}
    </Badge>
  );
}
