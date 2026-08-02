"use client";

import { memo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { CategoryBreakdown } from "@/lib/math/finance";
import { useMounted } from "@/hooks/use-mounted";
import { useCurrency } from "@/hooks/use-currency";

const CATEGORY_COLORS = ["#2563eb", "#14b8a6", "#f97316", "#8b5cf6", "#ef4444", "#84cc16"];

interface CategoryChartProps {
  data: CategoryBreakdown[];
}

function CategoryChartComponent({ data }: CategoryChartProps) {
  const mounted = useMounted();
  const { format } = useCurrency();

  if (!mounted) {
    return <div className="h-[300px] w-full bg-muted/5 animate-pulse rounded-lg" />;
  }

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={72}
            outerRadius={102}
            dataKey="value"
            nameKey="name"
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, _name, payload) => {
              const numericValue =
                typeof value === "number" ? value : Number(value ?? 0);
              const percentage = payload?.payload?.percentage ?? 0;
              return [
                `${format(numericValue)} (${Math.round(percentage)}%)`,
                "Amount",
              ];
            }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export const CategoryChart = memo(CategoryChartComponent);

