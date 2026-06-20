"use client";

import { getBoutProbabilitySummary } from "@/lib/chart-data";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Stacked horizontal-style bout probability overview across the card. */
export function BoutProbabilityChart() {
  const data = getBoutProbabilitySummary();

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
          <Tooltip
            contentStyle={{
              background: "hsl(222 47% 8%)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
            }}
            formatter={(value, name) => [
              `${value ?? 0}%`,
              name === "red" ? "Red corner" : "Blue corner",
            ]}
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
