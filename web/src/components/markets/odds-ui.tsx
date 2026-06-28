"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMarketOdds } from "@/hooks/use-market-odds";
import {
  favoriteCorner,
  modelEdgeSummary,
  probToAmerican,
  probToDecimal,
  redEdge,
  type OddsPair,
} from "@/lib/odds";
import { getBoutMarketContext, getMarketsProviderKind } from "@/lib/markets";
import { BetDialog } from "@/components/markets/bet-dialog";
import { cn } from "@/lib/utils";
import type { Bout, WinProbability } from "@/types/fight-card";
import { ArrowRightLeft, Loader2 } from "lucide-react";

import {
  ConfidenceBadge,
  MarketStatusChip,
} from "@/components/charts/prediction-insight";

/** Horizontal red/blue implied-probability bar. */
export function OddsSplitBar({
  red,
  blue,
  className,
  height = "h-2.5",
}: {
  red: number;
  blue: number;
  className?: string;
  height?: string;
}) {
  const total = Math.max(red + blue, 1);
  const redPct = (red / total) * 100;

  return (
    <div
      className={cn("flex w-full overflow-hidden rounded-full bg-muted/40", height, className)}
      role="img"
      aria-label={`Red ${red}%, blue ${blue}%`}
    >
      <div className="bg-red-500/90 transition-all" style={{ width: `${redPct}%` }} />
      <div className="flex-1 bg-blue-500/90" />
    </div>
  );
}

function CornerOdds({
  corner,
  prob,
  name,
  showAmerican = true,
  size = "md",
}: {
  corner: "red" | "blue";
  prob: number;
  name: string;
  showAmerican?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const color = corner === "red" ? "text-red-400" : "text-blue-400";
  const border =
    corner === "red" ? "border-red-500/25 bg-red-500/5" : "border-blue-500/25 bg-blue-500/5";
  const probSize =
    size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-sm";

  return (
    <div className={cn("rounded-lg border p-3 text-center", border)}>
      <p className={cn("truncate text-xs font-medium", color)} title={name}>
        {name}
      </p>
      <p className={cn("mt-1 font-mono font-semibold tabular-nums", probSize, color)}>
        {prob}%
      </p>
      {showAmerican ? (
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
          {probToAmerican(prob)} · {probToDecimal(prob)}x
        </p>
      ) : null}
    </div>
  );
}

function EdgeBadge({
  model,
  market,
  redName,
  blueName,
}: {
  model: OddsPair;
  market: OddsPair;
  redName: string;
  blueName: string;
}) {
  const edge = modelEdgeSummary(model, market);
  if (!edge) {
    return (
      <Badge variant="outline" className="border-zinc-500/30 text-[10px] text-zinc-400">
        Aligned with market
      </Badge>
    );
  }
  const who = edge.corner === "red" ? redName : blueName;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="cursor-help border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-300"
          >
            Model +{edge.delta}pp on {who.split(" ")[0]}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          Model implies {edge.corner === "red" ? model.red : model.blue}% vs market{" "}
          {edge.corner === "red" ? market.red : market.blue}% on {who}.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export type BoutOddsPanelVariant = "full" | "compact" | "inline";

interface BoutOddsPanelProps {
  bout: Bout;
  variant?: BoutOddsPanelVariant;
  className?: string;
}

/** Unified model vs Rain/market odds block — used across dashboard, cards, and tables. */
export function BoutOddsPanel({ bout, variant = "full", className }: BoutOddsPanelProps) {
  const ctx = getBoutMarketContext(bout);
  const { modelOdds, marketOdds, marketAvailable, loading } = useMarketOdds({
    marketId: ctx.marketId,
    marketStatus: ctx.marketStatus,
    redElo: bout.red_elo ?? bout.red_corner.elo,
    blueElo: bout.blue_elo ?? bout.blue_corner.elo,
  });

  const model: WinProbability = bout.win_probability ?? modelOdds;
  const redName = bout.red_corner.display_name;
  const blueName = bout.blue_corner.display_name;
  const hasMarket = marketAvailable && marketOdds && !loading;
  const provider = getMarketsProviderKind();
  const marketLabel = provider === "rain" ? "Rain" : "Market";

  if (variant === "inline") {
    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm">
          <span>
            <span className="text-muted-foreground">Model </span>
            <span className="text-red-400">{model.red}%</span>
            <span className="text-muted-foreground"> / </span>
            <span className="text-blue-400">{model.blue}%</span>
          </span>
          <span className="text-muted-foreground">·</span>
          <span>
            <span className="text-muted-foreground">{marketLabel} </span>
            {loading ? (
              <Loader2 className="inline size-3 animate-spin text-muted-foreground" />
            ) : hasMarket ? (
              <>
                <span className="text-red-400">{marketOdds.red}%</span>
                <span className="text-muted-foreground"> / </span>
                <span className="text-blue-400">{marketOdds.blue}%</span>
              </>
            ) : (
              <span className="text-muted-foreground">Pending</span>
            )}
          </span>
        </div>
        <OddsSplitBar red={model.red} blue={model.blue} height="h-1.5" />
        {hasMarket ? (
          <OddsSplitBar red={marketOdds.red} blue={marketOdds.blue} height="h-1.5" className="opacity-70" />
        ) : null}
      </div>
    );
  }

  if (variant === "compact") {
    const display = hasMarket ? marketOdds : model;
    const fav = favoriteCorner(display);
    return (
      <div className={cn("space-y-2 text-right", className)}>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {hasMarket ? `${marketLabel} implied` : "Model pick"}
          </p>
          <p className="font-mono text-sm tabular-nums">
            <span className="text-red-400">{display.red}%</span>
            <span className="mx-1 text-muted-foreground">/</span>
            <span className="text-blue-400">{display.blue}%</span>
          </p>
          <p className="text-[10px] text-muted-foreground">
            Fav: {fav === "red" ? redName : blueName}
          </p>
        </div>
        <OddsSplitBar red={display.red} blue={display.blue} height="h-1.5" />
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <ConfidenceBadge confidence={model.confidence} />
          <MarketStatusChip status={ctx.marketStatus} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 gap-3">
        <CornerOdds corner="red" prob={model.red} name={redName} />
        <CornerOdds corner="blue" prob={model.blue} name={blueName} />
      </div>
      <div className="rounded-lg border border-border/50 bg-muted/15 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Model</p>
          <ArrowRightLeft className="size-3 text-muted-foreground" />
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {marketLabel}
          </p>
        </div>
        <OddsSplitBar red={model.red} blue={model.blue} />
        {loading ? (
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Loading {marketLabel.toLowerCase()} prices…
          </div>
        ) : hasMarket ? (
          <>
            <OddsSplitBar
              red={marketOdds.red}
              blue={marketOdds.blue}
              className="mt-2 opacity-80"
            />
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <EdgeBadge
                model={model}
                market={marketOdds}
                redName={redName}
                blueName={blueName}
              />
            </div>
          </>
        ) : (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {provider === "rain"
              ? "Rain market not live yet — model seeds the opening price"
              : "Simulated market preview — set NEXT_PUBLIC_MARKETS_PROVIDER=rain for live prices"}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <ConfidenceBadge confidence={model.confidence} />
        <MarketStatusChip status={ctx.marketStatus} />
      </div>
      {ctx.marketId ? (
        <BetDialog
          marketId={ctx.marketId}
          redName={redName}
          blueName={blueName}
          redProb={hasMarket ? marketOdds.red : model.red}
          blueProb={hasMarket ? marketOdds.blue : model.blue}
        />
      ) : null}
    </div>
  );
}

/** Compact row for table / overview grids. */
export function BoutOddsMini({ bout }: { bout: Bout }) {
  const ctx = getBoutMarketContext(bout);
  const { modelOdds, marketOdds, marketAvailable, loading } = useMarketOdds({
    marketId: ctx.marketId,
    marketStatus: ctx.marketStatus,
    redElo: bout.red_elo ?? bout.red_corner.elo,
    blueElo: bout.blue_elo ?? bout.blue_corner.elo,
  });
  const model = bout.win_probability ?? modelOdds;
  const hasMarket = marketAvailable && marketOdds && !loading;
  const display = hasMarket ? marketOdds : model;

  return (
    <div className="min-w-[120px] space-y-1">
      <div className="font-mono text-xs tabular-nums">
        <span className="text-red-400">{display.red}</span>
        <span className="text-muted-foreground"> / </span>
        <span className="text-blue-400">{display.blue}</span>
      </div>
      <OddsSplitBar red={display.red} blue={display.blue} height="h-1.5" />
      {hasMarket && modelEdgeSummary(model, marketOdds) ? (
        <p className="text-[10px] text-amber-400/90">
          Δ {redEdge(model, marketOdds) > 0 ? "+" : ""}
          {redEdge(model, marketOdds)}pp red
        </p>
      ) : null}
    </div>
  );
}
