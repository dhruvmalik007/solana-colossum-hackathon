"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type DistributionPoint = { x: number; y: number };

export function DistributionChart({
  marketRange,
  consensus,
  user,
  initial,
  height = 240,
}: {
  marketRange: [number, number];
  consensus?: DistributionPoint[];
  user?: DistributionPoint[];
  initial?: DistributionPoint[];
  height?: number;
}) {
  const [min, max] = marketRange;

  const domainX: [number, number] = [min, max];
  const domainY: [number, number] = [0, Math.max(
    ...(consensus || []).map((p) => p.y),
    ...(user || []).map((p) => p.y),
    ...(initial || []).map((p) => p.y),
    1
  )];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        <AreaChart data={mergeSeries([consensus, user, initial])} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <XAxis type="number" dataKey="x" domain={domainX} tick={{ fontSize: 10 }} />
          <YAxis type="number" domain={domainY} tick={{ fontSize: 10 }} width={28} />
          <Tooltip formatter={(v: any) => (typeof v === "number" ? v.toFixed(4) : v)} />
          {initial ? (
            <Area type="monotone" dataKey="initial" stroke="#a3a3a3" fill="#a3a3a3" fillOpacity={0.2} />
          ) : null}
          {consensus ? (
            <Area type="monotone" dataKey="consensus" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
          ) : null}
          {user ? (
            <Area type="monotone" dataKey="user" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function mergeSeries(seriesArr: (DistributionPoint[] | undefined)[]) {
  const byX = new Map<number, any>();
  const mapping: { key: "consensus" | "user" | "initial"; data?: DistributionPoint[] }[] = [
    { key: "consensus", data: seriesArr[0] },
    { key: "user", data: seriesArr[1] },
    { key: "initial", data: seriesArr[2] },
  ];
  for (const { key, data } of mapping) {
    if (!data) continue;
    for (const p of data) {
      const row = byX.get(p.x) || { x: p.x };
      row[key] = p.y;
      byX.set(p.x, row);
    }
  }
  return Array.from(byX.values()).sort((a, b) => a.x - b.x);
}
