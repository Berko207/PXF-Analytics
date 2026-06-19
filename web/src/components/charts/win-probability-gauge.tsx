"use client";

import type { WinProbability } from "@/types/fight-card";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface WinProbabilityGaugeProps {
  probability: WinProbability;
  redName: string;
  blueName: string;
  size?: number;
}

/** Polymarket-style semi-circular win probability gauge. */
export function WinProbabilityGauge({
  probability,
  redName,
  blueName,
  size = 220,
}: WinProbabilityGaugeProps) {
  const data = [
    { name: "Red", value: probability.red, fill: "#ef4444" },
    { name: "Blue", value: probability.blue, fill: "#3b82f6" },
  ];

  const favorite =
    probability.red >= probability.blue
      ? { name: redName, value: probability.red, color: "text-red-400" }
      : { name: blueName, value: probability.blue, color: "text-blue-400" };

  return (
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
        <p className="mt-1 max-w-[180px] truncate text-xs text-muted-foreground mx-auto">
          {favorite.name}
        </p>
      </div>

      <div className="mt-2 flex justify-between text-xs font-mono">
        <span className="text-red-400">{probability.red}%</span>
        <span className="text-blue-400">{probability.blue}%</span>
      </div>
    </div>
  );
}
