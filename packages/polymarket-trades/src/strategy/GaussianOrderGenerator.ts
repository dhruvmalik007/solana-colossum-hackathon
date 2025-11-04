import { GaussianParams, GeneratedOrder, Side } from "../types";
import { generatePriceLadder } from "./PriceLadder";
import { roundToTick } from "../utils/rounding";

/**
 * GaussianOrderGenerator
 *
 * Generates a batch of orders distributed around a mean using a Gaussian-inspired sizing rule.
 * The relative weight of each price level is proportional to exp(-0.5 * ((p-mean)/sigma)^2).
 */
export class GaussianOrderGenerator {
  /**
   * Generate a set of orders based on Gaussian parameters and tick size rounding.
   * Ensures each order meets minPerOrder, and total sums to totalSize (within rounding tolerance).
   */
  generate(params: GaussianParams, tickSize: number): GeneratedOrder[] {
    const prices = generatePriceLadder(params);
    if (prices.length === 0) return [];

    const { mean, sigma, totalSize, minPerOrder, side } = params;

    // Compute gaussian weights
    const weights = prices.map((p) => Math.exp(-0.5 * Math.pow((p - mean) / Math.max(sigma, 1e-12), 2)));
    const wsum = weights.reduce((a, b) => a + b, 0);

    // Allocate sizes proportional to weights
    let allocations = weights.map((w) => (wsum > 0 ? (w / wsum) * totalSize : totalSize / prices.length));

    // Enforce minPerOrder; if a level falls below min, drop it and redistribute
    let filtered: Array<{ price: number; size: number }> = prices.map((p, i) => ({ price: p, size: allocations[i] }));

    const result: GeneratedOrder[] = [];
    let remaining = totalSize;
    for (const item of filtered) {
      const size = item.size >= minPerOrder ? item.size : 0;
      if (size > 0 && remaining > 0) {
        const finalSize = Math.min(size, remaining);
        const roundedPrice = roundToTick(item.price, tickSize, "nearest");
        result.push({ price: roundedPrice, size: finalSize, side });
        remaining -= finalSize;
      }
    }

    // If remaining due to minPerOrder trims, place remainder on the best price (closest to mean)
    if (remaining > 0) {
      const closest = prices.reduce((prev, curr) => (Math.abs(curr - mean) < Math.abs(prev - mean) ? curr : prev), prices[0]);
      const roundedPrice = roundToTick(closest, tickSize, "nearest");
      result.push({ price: roundedPrice, size: remaining, side });
    }

    return result;
  }
}
