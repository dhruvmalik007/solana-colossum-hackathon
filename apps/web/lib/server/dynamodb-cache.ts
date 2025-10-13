/**
 * DynamoDB-based cache implementation for AWS Lambda/Amplify deployment
 * Replaces file-based caching which doesn't work in serverless environments
 */

import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

// Initialize DynamoDB client (credentials from environment/IAM role)
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const TABLE_NAME = process.env.DYNAMODB_CACHE_TABLE_NAME || "solana-prediction-cache-dev";

interface CacheItem {
  cacheKey: string;
  data: string; // JSON stringified data
  ttl: number; // Unix timestamp for TTL
  createdAt: number;
}

/**
 * Read cached data from DynamoDB
 */
async function readCache<T = any>(cacheKey: string): Promise<T | null> {
  try {
    const command = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ cacheKey }),
      ConsistentRead: false, // Use eventual consistency for better performance
    });

    const response = await dynamoClient.send(command);

    if (!response.Item) {
      return null;
    }

    const item = unmarshall(response.Item) as CacheItem;

    // Check if item is expired (DynamoDB TTL is eventual, so we double-check)
    if (item.ttl && item.ttl < Math.floor(Date.now() / 1000)) {
      console.log(`[DynamoDB Cache] Cache expired for key: ${cacheKey}`);
      return null;
    }

    // Parse and return data
    return JSON.parse(item.data) as T;
  } catch (error) {
    console.error(`[DynamoDB Cache] Error reading cache for key ${cacheKey}:`, error);
    return null;
  }
}

/**
 * Write data to DynamoDB cache
 */
async function writeCache(cacheKey: string, data: any, ttlMs: number): Promise<void> {
  try {
    const now = Date.now();
    const ttl = Math.floor((now + ttlMs) / 1000); // Convert to Unix timestamp in seconds

    const item: CacheItem = {
      cacheKey,
      data: JSON.stringify(data),
      ttl,
      createdAt: now,
    };

    const command = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(item),
    });

    await dynamoClient.send(command);
    console.log(`[DynamoDB Cache] Cached data for key: ${cacheKey} (TTL: ${ttlMs}ms)`);
  } catch (error) {
    console.error(`[DynamoDB Cache] Error writing cache for key ${cacheKey}:`, error);
    // Don't throw - cache write failures shouldn't break the application
  }
}

/**
 * Check if cached data is fresh (exists and not expired)
 */
async function isFresh(cacheKey: string): Promise<boolean> {
  try {
    const command = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ cacheKey }),
      ProjectionExpression: "ttl",
      ConsistentRead: false,
    });

    const response = await dynamoClient.send(command);

    if (!response.Item) {
      return false;
    }

    const item = unmarshall(response.Item) as Pick<CacheItem, "ttl">;
    const now = Math.floor(Date.now() / 1000);

    return item.ttl > now;
  } catch (error) {
    console.error(`[DynamoDB Cache] Error checking freshness for key ${cacheKey}:`, error);
    return false;
  }
}

/**
 * Delete cached data
 */
async function deleteCache(cacheKey: string): Promise<void> {
  try {
    const command = new DeleteItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ cacheKey }),
    });

    await dynamoClient.send(command);
    console.log(`[DynamoDB Cache] Deleted cache for key: ${cacheKey}`);
  } catch (error) {
    console.error(`[DynamoDB Cache] Error deleting cache for key ${cacheKey}:`, error);
  }
}

/**
 * Main cache wrapper function - similar interface to file-based cache
 * Fetches data from cache if fresh, otherwise calls fetcher and caches the result
 */
export async function withDynamoDBCache<T>(
  cacheKey: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  shrink?: (data: T) => any
): Promise<T> {
  // Try to get from cache
  const cached = await readCache<T>(cacheKey);
  if (cached !== null) {
    console.log(`[DynamoDB Cache] Cache HIT for key: ${cacheKey}`);
    return cached;
  }

  console.log(`[DynamoDB Cache] Cache MISS for key: ${cacheKey}, fetching...`);

  // Cache miss - fetch fresh data
  const data = await fetcher();

  // Store in cache (apply shrink function if provided)
  const toStore = shrink ? shrink(data) : data;
  await writeCache(cacheKey, toStore, ttlMs);

  return toStore as T;
}

/**
 * Export individual functions for advanced use cases
 */
export { readCache, writeCache, isFresh, deleteCache };

/**
 * Health check function to verify DynamoDB connection
 */
export async function checkDynamoDBConnection(): Promise<boolean> {
  try {
    const testKey = "health-check-test";
    await writeCache(testKey, { test: true }, 60000);
    const result = await readCache(testKey);
    await deleteCache(testKey);
    return result !== null;
  } catch (error) {
    console.error("[DynamoDB Cache] Health check failed:", error);
    return false;
  }
}
