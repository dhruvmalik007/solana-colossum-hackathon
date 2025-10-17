import { z } from "zod";

const EnvSchema = z.object({
  AWS_REGION: z.string().default("us-east-1"),
  AWS_DYNAMODB_ENDPOINT: z.string().optional(), // for local dev
  DYNAMODB_TABLE_MARKETS: z.string().default("markets"),
  DYNAMODB_TABLE_POSITIONS: z.string().default("positions"),
  DYNAMODB_TABLE_TRADES: z.string().default("trades"),
  DYNAMODB_TABLE_ORDERS: z.string().default("orders"),
  DYNAMODB_TABLE_CREATOR_PROFILES: z.string().default("creator-profiles"),
});

export const env = EnvSchema.parse(process.env);
