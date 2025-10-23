"use client";

import * as React from "react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export type FiltersBarValue = {
  category?: string;
  status?: string;
  sort?: string;
  q?: string;
};

export function FiltersBar({ value, onChange, categories }: { value: FiltersBarValue; onChange: (v: FiltersBarValue) => void; categories?: string[] }) {
  const set = (k: keyof FiltersBarValue, v?: string) => onChange({ ...value, [k]: v });
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex gap-2 w-full md:w-auto">
        <Select value={value.category || "All"} onValueChange={(v) => set("category", v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {(categories || []).map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={value.status || "All"} onValueChange={(v) => set("status", v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Resolving">Resolving</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={value.sort || "Newest"} onValueChange={(v) => set("sort", v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Newest">Newest</SelectItem>
            <SelectItem value="EndingSoon">Ending soon</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="w-full md:w-80">
        <Input placeholder="Search markets…" value={value.q || ""} onChange={(e) => set("q", e.target.value)} />
      </div>
    </div>
  );
}
