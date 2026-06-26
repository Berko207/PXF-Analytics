"use client";

import type { Bout } from "@/types/fight-card";
import { useMarketOdds } from "@/hooks/use-market-odds";
import { getBoutMarketContext } from "@/lib/markets";
import type { WinProbability } from "@/types/fight-card";
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

/** Polymarket-style semi-circular win probability gauge with live odds. */
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

  const display =
    probability ??
    (marketAvailable && marketOdds && !loading ? marketOdds : modelOdds);

  const data = [
    { name: "Red", value: display.red, fill: "#ef4444" },
    { name: "Blue", value: display.blue, fill: "#3b82f6" },
  ];

  const favorite =
    display.red >= display.blue
      ? { name: redName, value: display.red, color: "text-red-400" }
      : { name: blueName, value: display.blue, color: "text-blue-400" };

  const sourceLabel =
    marketAvailable && marketOdds && !loading ? "Market" : "Model";

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
          <p className="mx-auto mt-1 max-w-[180px] truncate text-xs text-muted-foreground">
            {favorite.name}
          </p>
        </div>

        <div className="mt-2 flex justify-between font-mono text-xs">
          <span className="text-red-400">{display.red}%</span>
          <span className="text-blue-400">{display.blue}%</span>
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
        {sourceLabel} implied · Model {modelOdds.red}/{modelOdds.blue}
        {marketAvailable && marketOdds && !loading
          ? ` · Market ${marketOdds.red}/${marketOdds.blue}`
          : " · Market pending"}
      </p>
    </div>
  );
}
