"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

const DEFAULT_CATEGORIES = [
  "Stablecoins",
  "yieldFarming",
  "DeFi",
  "Macro-ecosystem",
  "solana account  forensics",
  "Ecosystem investment"
];

export function CategoriesNav({
  categories = DEFAULT_CATEGORIES,
  onChange,
  initial = "All",
}: {
  categories?: string[];
  onChange?: (c: string) => void;
  initial?: string;
}) {
  const [active, setActive] = useState(initial);
  return (
    <Tabs
      value={active}
      onValueChange={(val) => {
        setActive(val);
        onChange?.(val);
      }}
      className="w-full"
    >
      <TabsList className="no-scrollbar flex w-full items-center gap-1 overflow-x-auto px-1 py-1">
        <TabsTrigger value="All" className="whitespace-nowrap rounded-full">
          All
        </TabsTrigger>
        {categories.map((c) => (
          <TabsTrigger key={c} value={c} className="whitespace-nowrap rounded-full">
            {c}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
