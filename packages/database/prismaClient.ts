import "server-only";

import { PrismaClient } from "@prisma/client";
import { env } from "./keys";

let prismaSingleton: PrismaClient | null = null;

/**
 * Get a singleton Prisma client configured for Neon with connection pooling.
 * Uses DATABASE_URL (pooled) for runtime; DIRECT_URL is used by Prisma CLI for migrations.
 * Returns null if DATABASE_URL is not set.
 * Ensures safe reuse across hot reloads and serverless invocations.
 */
export function getPrisma(): PrismaClient | null {
  if (!env.DATABASE_URL) return null;
  if (prismaSingleton) return prismaSingleton;
  prismaSingleton = new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });
  return prismaSingleton;
}
