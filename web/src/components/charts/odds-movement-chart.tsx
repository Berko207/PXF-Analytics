"use client";

import { getOddsMovement } from "@/lib/chart-data";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface OddsMovementChartProps {
  boutNumber: number;
  redName: string;
  blueName: string;
}

/** Line chart showing simulated odds movement toward fight night. */
export function OddsMovementChart({ boutNumber, redName, blueName }: OddsMovementChartProps) {
  const data = getOddsMovement(boutNumber);

  return (
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
  );
}
