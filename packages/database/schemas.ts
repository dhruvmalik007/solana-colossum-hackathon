import { z } from "zod";

export const MarketStatusSchema = z.enum(["Draft", "Active", "Resolving", "Resolved"]);

export const MarketSchema = z.object({
  id: z.string().min(1), // slug
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  createdAt: z.string().min(1), // ISO
  resolutionTime: z.string().optional(),
  status: MarketStatusSchema,
});
export type Market = z.infer<typeof MarketSchema>;

export const PositionSchema = z.object({
  id: z.string().min(1),
  marketId: z.string().min(1),
  owner: z.string().min(1),
  size: z.number(),
  collateralLocked: z.number(),
  createdAt: z.string().min(1),
});
export type Position = z.infer<typeof PositionSchema>;

export const TradeSchema = z.object({
  id: z.string().min(1),
  marketId: z.string().min(1),
  positionId: z.string().min(1),
  side: z.enum(["Buy", "Sell"]),
  size: z.number(),
  avgPrice: z.number(),
  feesPaid: z.number(),
  createdAt: z.string().min(1),
});
export type Trade = z.infer<typeof TradeSchema>;

export const OrderStatusSchema = z.enum(["Open", "Filled", "Cancelled"]);
export const OrderSchema = z.object({
  id: z.string().min(1),
  marketId: z.string().min(1),
  side: z.enum(["Buy", "Sell"]),
  price: z.number(),
  size: z.number(),
  remaining: z.number(),
  status: OrderStatusSchema,
  createdAt: z.string().min(1),
});
export type Order = z.infer<typeof OrderSchema>;
