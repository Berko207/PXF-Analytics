import { Badge } from "@/components/ui/badge";
import { getMarketsProviderKind } from "@/lib/markets";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

/** Rain prediction-market status banner — reflects mock vs live provider. */
export function MarketsTeaser() {
  const provider = getMarketsProviderKind();
  const isRain = provider === "rain";

  return (
    <div className="rounded-xl border border-dashed border-amber-500/25 bg-gradient-to-r from-amber-500/5 via-transparent to-blue-500/5 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <TrendingUp className="size-4 text-amber-400" />
          </div>
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
              Rain prediction markets
              <Badge
                variant="outline"
                className={
                  isRain
                    ? "border-emerald-500/30 text-[10px] uppercase tracking-wide text-emerald-400"
                    : "border-amber-500/30 text-[10px] uppercase tracking-wide text-amber-400"
                }
              >
                {isRain ? "Live SDK" : "Preview mode"}
              </Badge>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isRain ? (
                <>
                  Connected to Rain on Arbitrum — live implied prices stream into bout cards and
                  the{" "}
                  <Link href="/analytics" className="text-amber-400/90 hover:underline">
                    Analytics
                  </Link>{" "}
                  dashboard.
                </>
              ) : (
                <>
                  Model odds seed Rain market prices. Simulated market lines preview trading UI
                  until{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                    NEXT_PUBLIC_MARKETS_PROVIDER=rain
                  </code>{" "}
                  is set. Explore comparisons in{" "}
                  <Link href="/analytics" className="text-amber-400/90 hover:underline">
                    Analytics
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
