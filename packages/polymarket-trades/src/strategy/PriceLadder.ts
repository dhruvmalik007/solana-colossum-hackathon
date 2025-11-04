/**
 * PriceLadder
 * Generates a price ladder for limit orders based on Gaussian params.
 */
import { GaussianParams, Side } from "../types";

/**
 * Generate prices around the mean according to spacing and levels.
 * - For BUY, generates prices below or equal to mean (descending).
 * - For SELL, generates prices at or above mean (ascending).
 */
export function generatePriceLadder(params: GaussianParams, clampMin?: number, clampMax?: number): number[] {
  const { mean, sigma, levels, spacing, side } = params;
  const prices: number[] = [];

  const step = spacing === "sigma" ? sigma : sigma; // "fixed" uses sigma as absolute step
  for (let i = 0; i < levels; i += 1) {
    const k = i + 1; // start offset from mean
    const raw = side === Side.BUY ? mean - k * step : mean + k * step;
    let p = raw;
    if (typeof clampMin === "number" && p < clampMin) p = clampMin;
    if (typeof clampMax === "number" && p > clampMax) p = clampMax;
    prices.push(p);
  }

  // Ensure unique & sorted per side
  const uniq = Array.from(new Set(prices));
  return side === Side.BUY ? uniq.sort((a, b) => b - a) : uniq.sort((a, b) => a - b);
}
