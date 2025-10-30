import { z } from "zod";
const EnvSchema = z.object({
  // Prisma + Neon
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(), // Direct connection for Prisma CLI (migrations)
});

export const env = EnvSchema.parse(process.env);
