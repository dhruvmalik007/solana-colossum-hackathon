/**
 * Round a price to the nearest valid tick size.
 * Ensures numerical stability for tick sizes expressed as decimals, e.g., 0.001.
 */
export function roundToTick(value: number, tick: number, mode: "nearest" | "down" | "up" = "nearest"): number {
  if (tick <= 0) return value;
  const ratio = value / tick;
  let rounded: number;
  switch (mode) {
    case "down":
      rounded = Math.floor(ratio);
      break;
    case "up":
      rounded = Math.ceil(ratio);
      break;
    default:
      rounded = Math.round(ratio);
  }
  const res = rounded * tick;
  // Fix floating precision to 8 decimals maximum
  return Number(res.toFixed(8));
}
