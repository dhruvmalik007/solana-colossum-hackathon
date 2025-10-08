"use client";

import * as React from "react";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@repo/ui/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export type SimpleLinePoint = { x: string | number; y: number };

export default function SimpleLineChart({
  data,
  xKey = "x",
  yKey = "y",
  label = "Value",
}: {
  data: SimpleLinePoint[];
  xKey?: string;
  yKey?: string;
  label?: string;
}) {
  const config: ChartConfig = {
    series: {
      label,
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <ChartContainer config={config} className="h-[300px] w-full">
      <LineChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} hide tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} width={60} />
        <Tooltip content={<ChartTooltipContent indicator="line" />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line type="monotone" dataKey={yKey} stroke="var(--color-series)" dot={false} strokeWidth={2} />
      </LineChart>
    </ChartContainer>
  );
}
