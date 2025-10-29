import { z } from "zod";

export const MarketCreationSchema = z.object({
  title: z.string().min(1, "Title required").max(120, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  category: z.enum(["Crypto", "DeFi", "Sports", "Politics", "Other"]).optional(),
  outcomeMin: z.number().finite("Must be finite"),
  outcomeMax: z.number().finite("Must be finite"),
  resolutionTime: z.string().refine((val) => {
    const date = new Date(val);
    return date > new Date();
  }, "Resolution time must be in the future"),
  oracleType: z.enum(["Pyth", "Manual", "Chainlink"]),
  oraclePubkey: z.string().optional(),
  feeBps: z.number().int().min(0).max(10000, "Fee must be 0-10000 bps"),
}).refine((data) => data.outcomeMin < data.outcomeMax, {
  message: "Outcome min must be less than max",
  path: ["outcomeMax"],
});

export type MarketCreationInput = z.infer<typeof MarketCreationSchema>;
