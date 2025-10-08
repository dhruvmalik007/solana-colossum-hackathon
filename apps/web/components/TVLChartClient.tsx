"use client";

import * as React from "react";
import {
  ChartContainer as _ChartContainer,
  ChartLegend as _ChartLegend,
  ChartLegendContent as _ChartLegendContent,
  // ChartTooltip,
  ChartTooltipContent as _ChartTooltipContent,
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

export type TVLPoint = { x: string; y: number };

export default function TVLChartClient({ data }: { data: TVLPoint[] }) {
  const config: ChartConfig = {
    tvl: { label: "TVL", color: "hsl(var(--chart-2))" },
  };

  // React 19 TS interop casts
  const ChartContainer = _ChartContainer as unknown as React.ComponentType<
    React.ComponentProps<"div"> & { config: ChartConfig; children: React.ReactNode }
  >;
  const ChartLegendContent = _ChartLegendContent as unknown as React.ComponentType<any>;
  const ChartLegend = _ChartLegend as unknown as React.ComponentType<any>;
  const ChartTooltipContent = _ChartTooltipContent as unknown as React.ComponentType<any>;

  return (
    <ChartContainer config={config} className="h-[300px] w-full">
      <LineChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" hide tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} width={60} />
        {/* @ts-ignore runtime OK */}
        <Tooltip content={<ChartTooltipContent indicator="line" />} />
        {/* @ts-ignore runtime OK */}
        <ChartLegend content={<ChartLegendContent />} />
        <Line type="monotone" dataKey="y" stroke="var(--color-tvl)" dot={false} strokeWidth={2} />
      </LineChart>
    </ChartContainer>
  );
}
