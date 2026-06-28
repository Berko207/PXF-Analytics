"use client";

import type { Bout } from "@/types/fight-card";
import { useMarketOdds } from "@/hooks/use-market-odds";
import { OddsSplitBar } from "@/components/markets/odds-ui";
import { getBoutMarketContext, getMarketsProviderKind } from "@/lib/markets";
import { probToAmerican } from "@/lib/odds";
import type { WinProbability } from "@/types/fight-card";
import {
  ConfidenceBadge,
  FactorList,
  MarketStatusChip,
} from "@/components/charts/prediction-insight";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface WinProbabilityGaugeProps {
  /** Bout context for live model + market odds. */
  bout: Bout;
  redName: string;
  blueName: string;
  size?: number;
  /** Override display probability (defaults to live market, then model). */
  probability?: WinProbability;
}

/** Semi-circular win probability gauge with model/market source and American odds. */
export function WinProbabilityGauge({
  bout,
  redName,
  blueName,
  size = 220,
  probability,
}: WinProbabilityGaugeProps) {
  const ctx = getBoutMarketContext(bout);
  const { modelOdds, marketOdds, marketAvailable, loading } = useMarketOdds({
    marketId: ctx.marketId,
    marketStatus: ctx.marketStatus,
    redElo: bout.red_elo ?? bout.red_corner.elo,
    blueElo: bout.blue_elo ?? bout.blue_corner.elo,
  });

  const model: WinProbability = bout.win_probability ?? modelOdds;
  const hasMarket = marketAvailable && marketOdds && !loading;
  const display = probability ?? (hasMarket ? marketOdds : model);
  const provider = getMarketsProviderKind();
  const sourceLabel = hasMarket
    ? provider === "rain"
      ? "Rain"
      : "Market"
    : "Model";

  const data = [
    { name: "Red", value: display.red, fill: "#ef4444" },
    { name: "Blue", value: display.blue, fill: "#3b82f6" },
  ];

  const favorite =
    display.red >= display.blue
      ? { corner: "red" as const, name: redName, value: display.red, color: "text-red-400" }
      : { corner: "blue" as const, name: blueName, value: display.blue, color: "text-blue-400" };

  const underdog =
    favorite.corner === "red"
      ? { name: blueName, value: display.blue, color: "text-blue-400" }
      : { name: redName, value: display.red, color: "text-red-400" };

  return (
    <div>
      <div className="relative mx-auto" style={{ width: size, height: size * 0.62 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-x-0 bottom-6 text-center">
          <p className={`text-3xl font-bold tabular-nums ${favorite.color}`}>
            {favorite.value}%
          </p>
          <p className="mx-auto mt-0.5 max-w-[180px] truncate text-xs font-medium">
            {favorite.name}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {probToAmerican(favorite.value)} · {sourceLabel}
          </p>
        </div>
      </div>

      <div className="mx-auto mt-1 flex max-w-[240px] justify-between text-xs">
        <div className="text-left">
          <p className="text-red-400">{display.red}%</p>
          <p className="truncate text-[10px] text-muted-foreground">{redName.split(" ")[0]}</p>
        </div>
        <div className="text-right">
          <p className="text-blue-400">{display.blue}%</p>
          <p className="truncate text-[10px] text-muted-foreground">{blueName.split(" ")[0]}</p>
        </div>
      </div>

      <OddsSplitBar red={display.red} blue={display.blue} className="mx-auto mt-2 max-w-[240px]" />

      {hasMarket ? (
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Model {model.red}/{model.blue} · {sourceLabel} {marketOdds.red}/{marketOdds.blue}
        </p>
      ) : (
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Model fair value · {underdog.name.split(" ")[0]} {probToAmerican(underdog.value)}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <ConfidenceBadge confidence={model.confidence} />
        <MarketStatusChip status={ctx.marketStatus} />
      </div>

      {model.factors && model.factors.length > 0 ? (
        <div className="mx-auto mt-3 max-w-[280px] rounded-lg border border-border/50 bg-muted/20 p-2.5">
          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            Key drivers
          </p>
          <FactorList factors={model.factors} redName={redName} blueName={blueName} />
        </div>
      ) : null}
    </div>
  );
}
