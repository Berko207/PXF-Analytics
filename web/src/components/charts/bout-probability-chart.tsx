"use client";

import type { FightCard } from "@/types/fight-card";
import { getBoutProbabilitySummary } from "@/lib/chart-data";
import { favoriteCorner } from "@/lib/odds";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Stacked bout probability overview — red + blue always sum to 100%. */
export function BoutProbabilityChart({ card }: { card?: FightCard }) {
  const data = getBoutProbabilitySummary(card).map((row) => ({
    ...row,
    favorite: favoriteCorner({ red: row.red, blue: row.blue }),
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="bout"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <ReferenceLine y={50} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
          <Tooltip
            contentStyle={{
              background: "hsl(222 47% 8%)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
            }}
            formatter={(value, name, item) => {
              const payload = item.payload as { favorite: "red" | "blue"; label: string };
              const corner = name === "red" ? "Red" : "Blue";
              const tag =
                payload.favorite === name ? " · favorite" : "";
              return [`${value ?? 0}%`, `${corner}${tag}`];
            }}
            labelFormatter={(label, payload) => {
              const item = payload?.[0]?.payload;
              return item ? `${label} · ${item.label}` : label;
            }}
          />
          <Bar dataKey="red" stackId="prob" fill="#ef4444" radius={[0, 0, 0, 0]} />
          <Bar dataKey="blue" stackId="prob" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
