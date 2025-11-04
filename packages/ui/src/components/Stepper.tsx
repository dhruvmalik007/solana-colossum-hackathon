"use client";

import * as React from "react";
import { cn } from "@repo/ui/lib/utils";
import { Separator } from "@repo/ui/components/ui/separator";
import { Button } from "./ui/button";
export type Step = { id: string; label: string; description?: string };

export function Stepper({
  steps,
  currentStep,
  onStepChange,
  className,
}: {
  steps: Step[];
  currentStep: number; // 0-indexed
  onStepChange?: (index: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <ol className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {steps.map((s, i) => {
          const state = i < currentStep ? "complete" : i === currentStep ? "active" : "pending";
          return (
            <li key={s.id} className="flex items-center gap-3">
              <Button
                type="button"
                onClick={() => onStepChange?.(i)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                  state === "complete" && "border-emerald-500 bg-emerald-500 text-white",
                  state === "active" && "border-primary bg-primary text-primary-foreground",
                  state === "pending" && "border-muted-foreground/30 text-muted-foreground"
                )}
                aria-current={state === "active" ? "step" : undefined}
              >
                {i + 1}
              </Button>
              <div className="min-w-0">
                <div className={cn("truncate text-sm font-medium", state === "pending" && "text-muted-foreground")}>{s.label}</div>
                {s.description ? (
                  <div className="truncate text-xs text-muted-foreground">{s.description}</div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      <Separator className="mt-3" />
    </div>
  );
}
