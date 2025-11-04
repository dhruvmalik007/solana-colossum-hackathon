import { GeneratedOrder, LiquidityPolicy, Side } from "../types";

/**
 * LiquidityManager
 *
 * Enforces risk/exposure constraints on a list of generated orders.
 */
export class LiquidityManager {
  /**
   * Enforce the LiquidityPolicy on a set of orders.
   * - Trims per-order sizes over maxPerOrder.
   * - Drops orders below minPerOrder.
   * - Caps total size at maxTotalSize.
   * - Optionally enforces skew between buy and sell totals.
   */
  enforce(orders: GeneratedOrder[], policy: LiquidityPolicy): GeneratedOrder[] {
    const maxPer = policy.maxPerOrder ?? Number.POSITIVE_INFINITY;

    // Trim per-order sizes and drop too small
    let processed = orders
      .map((o) => ({ ...o, size: Math.min(o.size, maxPer) }))
      .filter((o) => o.size >= policy.minPerOrder);

    // Enforce skew if requested
    if (typeof policy.maxSkewPct === "number") {
      const buy = processed.filter((o) => o.side === Side.BUY).reduce((s, o) => s + o.size, 0);
      const sell = processed.filter((o) => o.side === Side.SELL).reduce((s, o) => s + o.size, 0);
      const total = buy + sell || 1;
      const skew = Math.abs(buy - sell) / total;
      if (skew > policy.maxSkewPct) {
        // Reduce the dominant side proportionally
        const reduceSide = buy > sell ? Side.BUY : Side.SELL;
        const factor = (policy.maxSkewPct * total + Math.min(buy, sell)) / Math.max(buy, sell);
        processed = processed.map((o) => (o.side === reduceSide ? { ...o, size: o.size * factor } : o));
        processed = processed.filter((o) => o.size >= policy.minPerOrder);
      }
    }

    // Cap total size
    const totalSize = processed.reduce((s, o) => s + o.size, 0);
    if (totalSize > policy.maxTotalSize) {
      const factor = policy.maxTotalSize / totalSize;
      processed = processed.map((o) => ({ ...o, size: o.size * factor })).filter((o) => o.size >= policy.minPerOrder);
    }

    return processed;
  }
}
