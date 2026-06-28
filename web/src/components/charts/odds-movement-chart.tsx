"use client";

import { getOddsMovement } from "@/lib/chart-data";
import type { Bout } from "@/types/fight-card";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface OddsMovementChartProps {
  bout: Bout;
  redName: string;
  blueName: string;
}

/** Line chart showing odds movement toward fight night, with model fair-value reference. */
export function OddsMovementChart({ bout, redName, blueName }: OddsMovementChartProps) {
  const data = getOddsMovement(bout.bout_number);
  const modelRed = bout.win_probability.red;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-500" />
          {redName}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-blue-500" />
          {blueName}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0 w-4 border-t border-dashed border-amber-400" />
          Model fair ({modelRed}% red)
        </span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="day"
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
                name === "red" ? redName : blueName,
              ]}
            />
            <ReferenceLine
              y={modelRed}
              stroke="#fbbf24"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
            />
            <Legend
              formatter={(value) => (value === "red" ? redName : blueName)}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="red"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 3, fill: "#ef4444" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="blue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: "#3b82f6" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
