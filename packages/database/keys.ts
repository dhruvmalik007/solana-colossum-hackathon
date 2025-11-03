import { z } from "zod";
const EnvSchema = z.object({
  // Prisma + Neon
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(), // Direct connection for Prisma CLI (migrations)
});

export const env = EnvSchema.parse(process.env);
