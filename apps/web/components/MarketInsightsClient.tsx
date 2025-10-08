"use client";

import * as React from "react";

type Insight = {
  probability_percent: number;
  summary: string;
  drivers: string[];
  risks: string[];
  metrics_to_watch: string[];
  disclaimer: string;
};

function useLocalDaily<T>(key: string, producer: () => Promise<T>, ttlMs = 24 * 60 * 60 * 1000) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let canceled = false;
    const now = Date.now();
    const read = () => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { t: number; d: T };
        if (now - parsed.t < ttlMs) return parsed.d;
        return null;
      } catch {
        return null;
      }
    };
    const cached = read();
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const d = await producer();
        if (!canceled) {
          setData(d);
          setLoading(false);
          try { localStorage.setItem(key, JSON.stringify({ t: now, d })); } catch {}
        }
      } catch (e: any) {
        if (!canceled) { setError(e?.message ?? "error"); setLoading(false); }
      }
    })();
    return () => { canceled = true; };
  }, [key, producer, ttlMs]);

  return { data, loading, error } as const;
}

export default function MarketInsightsClient(props: {
  slug: string;
  name: string;
  category?: string;
  latest: number;
  change1d: number;
  seriesCount: number;
}) {
  const { slug, name, category, latest, change1d, seriesCount } = props;
  const { data, loading } = useLocalDaily<Insight>(
    `insights:${slug}:v1`,
    async () => {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, name, category, latest, change1d, series: { length: seriesCount } }),
      });
      if (!res.ok) throw new Error(`insights ${res.status}`);
      const body = await res.json();
      return body.data as Insight;
    }
  );

  if (loading) return <div className="text-sm text-muted-foreground">Generating insights…</div>;
  if (!data) return <div className="text-sm text-muted-foreground">No insights</div>;

  return (
    <div className="space-y-3 text-sm">
      <div>
        <span className="font-medium">Estimated probability:</span> {Math.round(data.probability_percent)}%
      </div>
      <div className="text-muted-foreground">{data.summary}</div>
      {!!data.drivers?.length && (
        <div>
          <div className="font-medium mb-1">Drivers</div>
          <ul className="list-disc pl-5 space-y-1">
            {data.drivers.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}
      {!!data.risks?.length && (
        <div>
          <div className="font-medium mb-1">Risks</div>
          <ul className="list-disc pl-5 space-y-1">
            {data.risks.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}
      {!!data.metrics_to_watch?.length && (
        <div>
          <div className="font-medium mb-1">Metrics</div>
          <ul className="list-disc pl-5 space-y-1">
            {data.metrics_to_watch.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}
      <div className="text-xs text-muted-foreground">{data.disclaimer}</div>
    </div>
  );
}
