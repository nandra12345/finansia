"use client";

import { memo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { MonthlyTrend } from "@/lib/math/finance";
import { useMounted } from "@/hooks/use-mounted";
import { useCurrency } from "@/hooks/use-currency";

interface MonthlyTrendChartProps {
  data: MonthlyTrend[];
}

function MonthlyTrendChartComponent({ data }: MonthlyTrendChartProps) {
  const mounted = useMounted();
  const { format } = useCurrency();

  if (!mounted) {
    return <div className="h-[300px] w-full bg-muted/5 animate-pulse rounded-lg" />;
  }

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => {
              const numericValue =
                typeof value === "number" ? value : Number(value ?? 0);
              return format(numericValue);
            }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
          />
          <Bar dataKey="income" fill="#16a34a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" fill="#dc2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export const MonthlyTrendChart = memo(MonthlyTrendChartComponent);

