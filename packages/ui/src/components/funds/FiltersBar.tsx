"use client";
import * as React from "react";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";

export function FiltersBar({ q, onChange }: { q: string; onChange: (v: string) => void }) {
  const [local, setLocal] = React.useState(q);

  React.useEffect(() => setLocal(q), [q]);

  // Debounce 300ms
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (local !== q) onChange(local);
    }, 300);
    return () => clearTimeout(t);
  }, [local]);

  return (
    <div className="flex items-center gap-2">
      <Input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Search funds..." className="max-w-sm" />
      {q && (
        <Button variant="outline" onClick={() => onChange("")}>Clear</Button>
      )}
    </div>
  );
}
