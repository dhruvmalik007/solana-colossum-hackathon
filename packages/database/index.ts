import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { env } from "./keys";

const baseClient = new DynamoDBClient({
  region: env.AWS_REGION,
  endpoint: env.AWS_DYNAMODB_ENDPOINT,
});

export const ddb = DynamoDBDocumentClient.from(baseClient);

export type MarketStatus = "Draft" | "Active" | "Resolving" | "Resolved";

export type Market = {
  id: string; // partition key
  slug: string; // human readable id
  title: string;
  description?: string;
  category?: string;
  createdAt: string; // ISO
  resolutionTime?: string; // ISO
  status: MarketStatus;
};

export type Position = {
  id: string; // partition key
  marketId: string; // GSI for market
  owner: string; // pubkey; GSI for owner
  size: number;
  collateralLocked: number;
  createdAt: string;
};

export type Trade = {
  id: string; // partition key
  marketId: string;
  positionId: string;
  side: "Buy" | "Sell";
  size: number;
  avgPrice: number;
  feesPaid: number;
  createdAt: string;
};

// Markets
export async function putMarket(market: Market) {
  await ddb.send(
    new PutCommand({ TableName: env.DYNAMODB_TABLE_MARKETS, Item: market })
  );
}

export async function getMarket(id: string) {
  const out = await ddb.send(
    new GetCommand({ TableName: env.DYNAMODB_TABLE_MARKETS, Key: { id } })
  );
  return (out.Item as Market) ?? null;
}

export async function getMarketBySlug(slug: string) {
  // For MVP, id == slug
  return getMarket(slug);
}

// Positions
export async function putPosition(position: Position) {
  await ddb.send(
    new PutCommand({ TableName: env.DYNAMODB_TABLE_POSITIONS, Item: position })
  );
}

// Trades
export async function putTrade(trade: Trade) {
  await ddb.send(
    new PutCommand({ TableName: env.DYNAMODB_TABLE_TRADES, Item: trade })
  );
}

// List helpers (MVP scans; optimize with GSIs later)
export async function listMarkets() {
  const out = await ddb.send(
    new ScanCommand({ TableName: env.DYNAMODB_TABLE_MARKETS })
  );
  return (out.Items as Market[]) ?? [];
}

// Orders (separate table suggested; reusing TRADES or new table requires env)
export type Order = {
  id: string;
  marketId: string;
  side: "Buy" | "Sell";
  price: number;
  size: number;
  remaining: number;
  status: "Open" | "Filled" | "Cancelled";
  createdAt: string;
};

export async function putOrder(order: Order) {
  const table = env.DYNAMODB_TABLE_ORDERS;
  const marketSide = `${order.marketId}#${order.side}`;
  // Use integer sort key based on price for stable ordering across GSIs
  const sort = Math.floor(Number(order.price) * 1_000_000);
  await ddb.send(
    new PutCommand({ TableName: table, Item: { ...order, marketSide, sort } })
  );
}

export async function listOrdersByMarket(marketId: string) {
  const table = env.DYNAMODB_TABLE_ORDERS;
  // TODO: Once GSIs are created, use QueryCommand on GSI1 (marketSide) for top-of-book
  // For now, use scan as MVP
  const out = await ddb.send(
    new ScanCommand({ TableName: table, FilterExpression: "marketId = :m", ExpressionAttributeValues: { ":m": marketId } })
  );
  return (out.Items as Order[]) ?? [];
}

// GSI-optimized queries (to be used after GSIs are created per DYNAMODB_GSIS.md)
export async function getTopBids(marketId: string, limit = 10) {
  // Query GSI: orders_by_market_buy (PK=marketId#Buy, SK=sort DESC)
  // Returns highest bids first
  const table = env.DYNAMODB_TABLE_ORDERS;
  const out = await ddb.send(
    new QueryCommand({
      TableName: table,
      IndexName: "orders_by_market_buy",
      KeyConditionExpression: "marketSide = :ms",
      ExpressionAttributeValues: { ":ms": `${marketId}#Buy` },
      ScanIndexForward: false, // DESC
      Limit: limit,
    })
  );
  return (out.Items as Order[]) ?? [];
}

export async function getTopAsks(marketId: string, limit = 10) {
  // Query GSI: orders_by_market_sell (PK=marketId#Sell, SK=sort ASC)
  // Returns lowest asks first
  const table = env.DYNAMODB_TABLE_ORDERS;
  const out = await ddb.send(
    new QueryCommand({
      TableName: table,
      IndexName: "orders_by_market_sell",
      KeyConditionExpression: "marketSide = :ms",
      ExpressionAttributeValues: { ":ms": `${marketId}#Sell` },
      ScanIndexForward: true, // ASC
      Limit: limit,
    })
  );
  return (out.Items as Order[]) ?? [];
}

export async function listTradesByMarket(marketId: string) {
  const out = await ddb.send(
    new ScanCommand({ TableName: env.DYNAMODB_TABLE_TRADES, FilterExpression: "marketId = :m", ExpressionAttributeValues: { ":m": marketId } })
  );
  return (out.Items as Trade[]) ?? [];
}

// GSI: trades_by_market_time (PK=marketId, SK=createdAt)
export async function listTradesByMarketTime(marketId: string, limit = 100, oldestFirst = false) {
  const out = await ddb.send(
    new QueryCommand({
      TableName: env.DYNAMODB_TABLE_TRADES,
      IndexName: "trades_by_market_time",
      KeyConditionExpression: "marketId = :m",
      ExpressionAttributeValues: { ":m": marketId },
      ScanIndexForward: oldestFirst, // false => newest first
      Limit: limit,
    })
  );
  return (out.Items as Trade[]) ?? [];
}

// GSI: trades_by_position_time (PK=positionId, SK=createdAt)
export async function listTradesByPositionTime(positionId: string, limit = 100, oldestFirst = false) {
  const out = await ddb.send(
    new QueryCommand({
      TableName: env.DYNAMODB_TABLE_TRADES,
      IndexName: "trades_by_position_time",
      KeyConditionExpression: "positionId = :p",
      ExpressionAttributeValues: { ":p": positionId },
      ScanIndexForward: oldestFirst,
      Limit: limit,
    })
  );
  return (out.Items as Trade[]) ?? [];
}

// Positions GSIs
export async function listPositionsByOwner(owner: string, limit = 100) {
  const out = await ddb.send(
    new QueryCommand({
      TableName: env.DYNAMODB_TABLE_POSITIONS,
      IndexName: "positions_by_owner",
      KeyConditionExpression: "owner = :o",
      ExpressionAttributeValues: { ":o": owner },
      Limit: limit,
    })
  );
  return (out.Items as Position[]) ?? [];
}

export async function listPositionsByMarket(marketId: string, limit = 100) {
  const out = await ddb.send(
    new QueryCommand({
      TableName: env.DYNAMODB_TABLE_POSITIONS,
      IndexName: "positions_by_market",
      KeyConditionExpression: "marketId = :m",
      ExpressionAttributeValues: { ":m": marketId },
      Limit: limit,
    })
  );
  return (out.Items as Position[]) ?? [];
}

export type CreatorProfile = {
  userId: string;
  walletAddress: string;
  role: "creator" | "participant" | "both";
  portfolioConnected: boolean;
  portfolioStats?: {
    totalMarketsCreated: number;
    totalVolume: number;
    successRate: number;
    averageAccuracy: number;
  };
  profileData?: {
    displayName: string;
    bio: string;
    avatar?: string;
    website?: string;
  };
  verificationStatus: "pending" | "verified" | "rejected";
  createdAt: string;
  updatedAt: string;
};

export async function putCreatorProfile(profile: CreatorProfile) {
  await ddb.send(
    new PutCommand({ TableName: env.DYNAMODB_TABLE_CREATOR_PROFILES, Item: profile })
  );
}

export async function getCreatorProfile(userId: string) {
  const out = await ddb.send(
    new GetCommand({ TableName: env.DYNAMODB_TABLE_CREATOR_PROFILES, Key: { userId } })
  );
  return (out.Item as CreatorProfile) ?? null;
}

// Comments
export type Comment = {
  id: string;
  marketId: string;
  userId: string;
  parentId?: string;
  text: string;
  votes: number;
  createdAt: string;
};

export async function putComment(comment: Comment) {
  await ddb.send(new PutCommand({ TableName: env.DYNAMODB_TABLE_COMMENTS, Item: comment }));
}

export async function listCommentsByMarket(marketId: string) {
  const out = await ddb.send(
    new ScanCommand({ TableName: env.DYNAMODB_TABLE_COMMENTS, FilterExpression: "marketId = :m", ExpressionAttributeValues: { ":m": marketId } })
  );
  const items = (out.Items as Comment[]) ?? [];
  items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return items;
}

export async function updateCommentVotes(id: string, delta: number) {
  await ddb.send(
    new UpdateCommand({
      TableName: env.DYNAMODB_TABLE_COMMENTS,
      Key: { id },
      UpdateExpression: "SET votes = if_not_exists(votes, :zero) + :d",
      ExpressionAttributeValues: { ":d": delta, ":zero": 0 },
    })
  );
}

// Embeds
export type Embed = {
  id: string;
  marketId: string;
  url: string;
  source: string;
  html?: string;
  createdAt: string;
};

export async function putEmbed(embed: Embed) {
  await ddb.send(new PutCommand({ TableName: env.DYNAMODB_TABLE_EMBEDS, Item: embed }));
}

export async function listEmbedsByMarket(marketId: string) {
  const out = await ddb.send(
    new ScanCommand({ TableName: env.DYNAMODB_TABLE_EMBEDS, FilterExpression: "marketId = :m", ExpressionAttributeValues: { ":m": marketId } })
  );
  const items = (out.Items as Embed[]) ?? [];
  items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return items;
}

export * from "./schemas";

export type DiscussionThread = {
  threadId: string;
  marketId: string;
  createdBy: string;
  status: "open" | "closed";
  createdAt: string;
  updatedAt?: string;
};

export type DiscussionMessage = {
  id: string;
  threadId: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: { type: string; url?: string; dataUrl?: string }[];
  createdAt: string;
};

export type MemoryPointer = {
  id: string;
  ownerType: "thread" | "message" | "market" | "user";
  ownerId: string;
  provider: "mem0";
  vectorId?: string;
  graphNodeId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
};

export async function putDiscussionThread(t: DiscussionThread) {
  await ddb.send(new PutCommand({ TableName: env.DYNAMODB_TABLE_DISCUSSION_THREADS, Item: t }));
}

export async function getDiscussionThread(threadId: string) {
  const out = await ddb.send(new GetCommand({ TableName: env.DYNAMODB_TABLE_DISCUSSION_THREADS, Key: { threadId } }));
  return (out.Item as DiscussionThread) ?? null;
}

export async function listDiscussionThreadsByMarket(marketId: string) {
  const out = await ddb.send(
    new ScanCommand({ TableName: env.DYNAMODB_TABLE_DISCUSSION_THREADS, FilterExpression: "marketId = :m", ExpressionAttributeValues: { ":m": marketId } })
  );
  const items = (out.Items as DiscussionThread[]) ?? [];
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items;
}

export async function putDiscussionMessage(m: DiscussionMessage) {
  await ddb.send(new PutCommand({ TableName: env.DYNAMODB_TABLE_DISCUSSION_MESSAGES, Item: m }));
}

export async function listDiscussionMessagesByThread(threadId: string) {
  const out = await ddb.send(
    new ScanCommand({ TableName: env.DYNAMODB_TABLE_DISCUSSION_MESSAGES, FilterExpression: "threadId = :t", ExpressionAttributeValues: { ":t": threadId } })
  );
  const items = (out.Items as DiscussionMessage[]) ?? [];
  items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return items;
}

export async function putMemoryPointer(p: MemoryPointer) {
  await ddb.send(new PutCommand({ TableName: env.DYNAMODB_TABLE_MEMORY_POINTERS, Item: p }));
}

export async function listMemoryPointers(ownerType: MemoryPointer["ownerType"], ownerId: string) {
  const out = await ddb.send(
    new ScanCommand({
      TableName: env.DYNAMODB_TABLE_MEMORY_POINTERS,
      FilterExpression: "ownerType = :ot AND ownerId = :oid",
      ExpressionAttributeValues: { ":ot": ownerType, ":oid": ownerId },
    })
  );
  return (out.Items as MemoryPointer[]) ?? [];
}
