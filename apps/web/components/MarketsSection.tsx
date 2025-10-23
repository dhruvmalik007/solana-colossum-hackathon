"use client";

import * as React from "react";
import { Input } from "@repo/ui/components/ui/input";
import { CategoriesNav } from "@repo/ui/components/CategoriesNav";
import HomeMarketsClient from "./HomeMarketsClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";

export default function MarketsSection() {
  const [category, setCategory] = React.useState<string>("All");
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [status, setStatus] = React.useState<string>("All");
  const [sort, setSort] = React.useState<string>("Newest");

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <section id="markets" className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <CategoriesNav onChange={(c) => setCategory(c)} initial={category} />
          <Select value={status} onValueChange={(v) => setStatus(v)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Resolving">Resolving</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Newest">Newest</SelectItem>
              <SelectItem value="EndingSoon">Ending soon</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-72">
          <Input placeholder="Search markets…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <HomeMarketsClient category={category} q={debouncedQ} status={status} sort={sort} />
    </section>
  );
}
