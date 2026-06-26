import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

/** Subtle hint that prediction-market wagering is on the roadmap. */
export function MarketsTeaser() {
  return (
    <div className="rounded-xl border border-dashed border-amber-500/25 bg-gradient-to-r from-amber-500/5 via-transparent to-blue-500/5 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <TrendingUp className="size-4 text-amber-400" />
          </div>
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
              Prediction markets
              <Badge
                variant="outline"
                className="border-amber-500/30 text-[10px] uppercase tracking-wide text-amber-400"
              >
                Coming soon
              </Badge>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              On-chain fight markets are in development. For now, explore model odds and
              market-style charts in{" "}
              <Link href="/analytics" className="text-amber-400/90 hover:underline">
                Analytics
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
