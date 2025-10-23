"use client";

import { useState } from "react";
import { Button } from "./ui/button";

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
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1">
      {categories.map((c) => (
        <Button
          key={c}
          size="sm"
          variant={c === active ? "default" : "outline"}
          className="rounded-full"
          onClick={() => {
            setActive(c);
            onChange?.(c);
          }}
        >
          {c}
        </Button>
      ))}
    </div>
  );
}
