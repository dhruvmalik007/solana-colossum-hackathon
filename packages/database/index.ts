
import { getPrisma } from "./prismaClient";
import { Prisma } from "@prisma/client";


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

// Narrowing helpers to convert database strings to strict unions
function toMarketStatus(s: string): MarketStatus {
  switch (s) {
    case "Draft":
    case "Active":
    case "Resolving":
    case "Resolved":
      return s;
    default:
      return "Active";
  }
}

function toSide(s: string): "Buy" | "Sell" {
  return s === "Sell" ? "Sell" : "Buy";
}

function toOrderStatus(s: string): "Open" | "Filled" | "Cancelled" {
  switch (s) {
    case "Filled":
    case "Cancelled":
      return s;
    default:
      return "Open";
  }
}

function toThreadStatus(s: string): "open" | "closed" {
  return s === "closed" ? "closed" : "open";
}

function toMessageRole(s: string): "user" | "assistant" | "system" {
  if (s === "assistant" || s === "system") return s;
  return "user";
}

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

export type CreatorProfile = {
  userId: string;
  walletAddress: string;
  role: "creator" | "participant" | "both";
  portfolioConnected: boolean;
  portfolioStats?: {
    totalMarketsCreated?: number;
    totalVolume?: number;
    successRate?: number;
    averageAccuracy?: number;
    solBalance?: number;
    tokenHoldings?: Array<{ mint: string; amount: number; decimals: number }>;
    nftCount?: number;
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

export type Comment = {
  id: string;
  marketId: string;
  userId: string;
  parentId?: string;
  text: string;
  votes: number;
  createdAt: string;
};

// Markets
/**
 * Create or update a market.
 */
export async function putMarket(market: Market) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  const return_params_hosted = await prisma.market.upsert({
    where: { id: market.id },
    create: {
      id: market.id,
      slug: market.slug,
      title: market.title,
      description: market.description ?? null,
      category: market.category ?? null,
      createdAt: new Date(market.createdAt),
      resolutionTime: market.resolutionTime ? new Date(market.resolutionTime) : null,
      status: market.status,
    },
    update: {
      slug: market.slug,
      title: market.title,
      description: market.description ?? null,
      category: market.category ?? null,
      resolutionTime: market.resolutionTime ? new Date(market.resolutionTime) : null,
      status: market.status,
    },
  });
  return return_params_hosted;
}

/**
 * Fetch a market by id.
 * Prisma path returns Market mapped from relational row; fallback uses DynamoDB.
 */
export async function getMarket(id: string) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  const m = await prisma.market.findUnique({ where: { id } });
  if (!m) return null;
  return {
    id: m.id,
    slug: m.slug,
    title: m.title,
    description: m.description ?? undefined,
    category: m.category ?? undefined,
    createdAt: m.createdAt.toISOString(),
    resolutionTime: m.resolutionTime ? m.resolutionTime.toISOString() : undefined,
    status: toMarketStatus(String(m.status)),
  } satisfies Market;
}

/**
 * Fetch a market by slug.
 * Prisma path queries unique slug; fallback assumes id == slug.
 */
export async function getMarketBySlug(slug: string) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  const m = await prisma.market.findUnique({ where: { slug } });
  if (!m) return null;
  return {
    id: m.id,
    slug: m.slug,
    title: m.title,
    description: m.description ?? undefined,
    category: m.category ?? undefined,
    createdAt: m.createdAt.toISOString(),
    resolutionTime: m.resolutionTime ? m.resolutionTime.toISOString() : undefined,
    status: toMarketStatus(String(m.status)),
  } satisfies Market;
}

// Positions
/**
 * Create a position using Prisma + Neon.
 */
export async function putPosition(position: Position) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  await prisma.position.create({
    data: {
      id: position.id,
      marketId: position.marketId,
      owner: position.owner,
      size: position.size,
      collateralLocked: position.collateralLocked,
      createdAt: new Date(position.createdAt),
    },
  });
}

// List helpers
/**
 * List all markets. Prisma returns rows ordered by createdAt desc to match API semantics.
 */
export async function listMarkets() {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  const rows = (await prisma.market.findMany({ orderBy: { createdAt: "desc" } })) as Array<{
    id: string; slug: string; title: string; description: string | null; category: string | null; createdAt: Date; resolutionTime: Date | null; status: string;
  }>;
  return rows.map((m: { id: string; slug: string; title: string; description: string | null; category: string | null; createdAt: Date; resolutionTime: Date | null; status: string; }) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    description: m.description ?? undefined,
    category: m.category ?? undefined,
    createdAt: m.createdAt.toISOString(),
    resolutionTime: m.resolutionTime ? m.resolutionTime.toISOString() : undefined,
    status: toMarketStatus(String(m.status)),
  })) satisfies Market[];
}

// Orders
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

// Trades
/**
 * Create a trade using Prisma + Neon.
 */
export async function putTrade(trade: Trade) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  await prisma.trade.create({
    data: {
      id: trade.id,
      marketId: trade.marketId,
      positionId: trade.positionId,
      side: trade.side,
      size: trade.size,
      avgPrice: trade.avgPrice,
      feesPaid: trade.feesPaid,
      createdAt: new Date(trade.createdAt),
    },
  });
}

// Removed DynamoDB-specific helpers.

// Fix lint about 'r' implicit any via typed param
export async function getCreatorProfile(userId: string) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  const r: { userId: string; walletAddress: string; role: string; portfolioConnected: boolean; portfolioStats: unknown; profileData: unknown; verificationStatus: string; createdAt: Date; updatedAt: Date; } | null = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!r) return null;
  return {
    userId: r.userId,
    walletAddress: r.walletAddress,
    role: r.role as "creator" | "participant" | "both",
    portfolioConnected: r.portfolioConnected,
    portfolioStats: (r.portfolioStats as unknown as CreatorProfile["portfolioStats"]) ?? undefined,
    profileData: (r.profileData as unknown as CreatorProfile["profileData"]) ?? undefined,
    verificationStatus: r.verificationStatus as "pending" | "verified" | "rejected",
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  } satisfies CreatorProfile;
}

/**
 * Upsert a creator profile.
 * Ensures an idempotent write keyed by userId.
 */
export async function putCreatorProfile(profile: CreatorProfile): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  await prisma.creatorProfile.upsert({
    where: { userId: profile.userId },
    create: {
      userId: profile.userId,
      walletAddress: profile.walletAddress,
      role: profile.role,
      portfolioConnected: profile.portfolioConnected,
      portfolioStats: profile.portfolioStats as Prisma.JsonObject,
      profileData: profile.profileData as Prisma.JsonObject,
      verificationStatus: profile.verificationStatus,
      createdAt: new Date(profile.createdAt),
      updatedAt: new Date(profile.updatedAt),
    },
    update: {
      walletAddress: profile.walletAddress,
      role: profile.role,
      portfolioConnected: profile.portfolioConnected,
      portfolioStats: profile.portfolioStats as Prisma.JsonObject,
      profileData: profile.profileData as Prisma.JsonObject,
      verificationStatus: profile.verificationStatus,
      updatedAt: new Date(profile.updatedAt),
    },
  });
}

/**
 * Insert a comment using Prisma + Neon.
 */
export async function putComment(comment: Comment) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  await prisma.comment.create({
    data: {
      id: comment.id,
      marketId: comment.marketId,
      userId: comment.userId,
      parentId: comment.parentId ?? null,
      text: comment.text,
      votes: comment.votes,
      createdAt: new Date(comment.createdAt),
    },
  });
}

/**
 * List comments for a market ordered by createdAt asc.
 */
export async function listCommentsByMarket(marketId: string) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  const rows = (await prisma.comment.findMany({ where: { marketId }, orderBy: { createdAt: "asc" } })) as Array<{
    id: string; marketId: string; userId: string; parentId: string | null; text: string; votes: number; createdAt: Date;
  }>;
  return rows.map((c: { id: string; marketId: string; userId: string; parentId: string | null; text: string; votes: number; createdAt: Date; }) => ({
    id: c.id,
    marketId: c.marketId,
    userId: c.userId,
    parentId: c.parentId ?? undefined,
    text: c.text,
    votes: c.votes,
    createdAt: c.createdAt.toISOString(),
  })) satisfies Comment[];
}

/**
 * Increment or decrement comment votes.
 */
export async function updateCommentVotes(id: string, delta: number) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  await prisma.comment.update({ where: { id }, data: { votes: { increment: delta } } });
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

/**
 * Insert an embed.
 */
export async function putEmbed(embed: Embed) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  await prisma.embed.create({
    data: {
      id: embed.id,
      marketId: embed.marketId,
      url: embed.url,
      source: embed.source,
      html: embed.html ?? null,
      createdAt: new Date(embed.createdAt),
    },
  });
}

/**
 * List embeds for a market ordered by createdAt asc.
 */
export async function listEmbedsByMarket(marketId: string) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  const rows = (await prisma.embed.findMany({ where: { marketId }, orderBy: { createdAt: "asc" } })) as Array<{
    id: string; marketId: string; url: string; source: string; html: string | null; createdAt: Date;
  }>;
  return rows.map((e: { id: string; marketId: string; url: string; source: string; html: string | null; createdAt: Date; }) => ({
    id: e.id,
    marketId: e.marketId,
    url: e.url,
    source: e.source,
    html: e.html ?? undefined,
    createdAt: e.createdAt.toISOString(),
  })) satisfies Embed[];
}

// schemas.ts merged into Prisma schema; no re-export

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
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  await prisma.discussionThread.create({
    data: {
      threadId: t.threadId,
      marketId: t.marketId,
      createdBy: t.createdBy,
      status: t.status,
      createdAt: new Date(t.createdAt),
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : null,
    },
  });
}

export async function getDiscussionThread(threadId: string) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  const r = await prisma.discussionThread.findUnique({ where: { threadId } });
  if (!r) return null;
  return {
    threadId: r.threadId,
    marketId: r.marketId,
    createdBy: r.createdBy,
    status: toThreadStatus(String(r.status)),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
  } satisfies DiscussionThread;
}

export async function listDiscussionThreadsByMarket(marketId: string) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  const rows = (await prisma.discussionThread.findMany({ where: { marketId }, orderBy: { createdAt: "desc" } })) as Array<{
    threadId: string; marketId: string; createdBy: string; status: string; createdAt: Date; updatedAt: Date | null;
  }>;
  return rows.map((r: { threadId: string; marketId: string; createdBy: string; status: string; createdAt: Date; updatedAt: Date | null; }) => ({
    threadId: r.threadId,
    marketId: r.marketId,
    createdBy: r.createdBy,
    status: toThreadStatus(String(r.status)),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
  })) satisfies DiscussionThread[];
}

export async function putDiscussionMessage(m: DiscussionMessage) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  await prisma.discussionMessage.create({
    data: {
      id: m.id,
      threadId: m.threadId,
      userId: m.userId,
      role: m.role,
      content: m.content,
      attachments: m.attachments as Prisma.JsonArray,
      createdAt: new Date(m.createdAt),
    },
  });
}

export async function listDiscussionMessagesByThread(threadId: string) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  const rows = (await prisma.discussionMessage.findMany({ where: { threadId }, orderBy: { createdAt: "asc" } })) as Array<{
    id: string; threadId: string; userId: string; role: string; content: string; attachments: unknown; createdAt: Date;
  }>;
  return rows.map((r: { id: string; threadId: string; userId: string; role: string; content: string; attachments: unknown; createdAt: Date; }) => ({
    id: r.id,
    threadId: r.threadId,
    userId: r.userId,
    role: toMessageRole(String(r.role)),
    content: r.content,
    attachments: (r.attachments as { type: string; url?: string; dataUrl?: string }[] | null) ?? undefined,
    createdAt: r.createdAt.toISOString(),
  })) satisfies DiscussionMessage[];
}

export async function putMemoryPointer(p: MemoryPointer) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  await prisma.memoryPointer.create({
    data: {
      id: p.id,
      ownerType: p.ownerType,
      ownerId: p.ownerId,
      provider: p.provider,
      vectorId: p.vectorId ?? null,
      graphNodeId: p.graphNodeId ?? null,
      tags: p.tags as Prisma.JsonArray as string[],
      metadata: p.metadata as Prisma.JsonObject,
      createdAt: new Date(p.createdAt),
    },
  });
}

export async function listMemoryPointers(ownerType: MemoryPointer["ownerType"], ownerId: string) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  const rows = await prisma.memoryPointer.findMany({ where: { ownerType: ownerType as any, ownerId } });
  return rows.map((r: { id: string; ownerType: string; ownerId: string; provider: string; vectorId: string | null; graphNodeId: string | null; tags: string[] | null; metadata: unknown; createdAt: Date; }) => ({
    id: r.id,
    ownerType: r.ownerType as MemoryPointer["ownerType"],
    ownerId: r.ownerId,
    provider: r.provider as "mem0",
    vectorId: r.vectorId ?? undefined,
    graphNodeId: r.graphNodeId ?? undefined,
    tags: (r.tags ?? undefined) as string[] | undefined,
    metadata: (r.metadata as unknown as Record<string, any>) ?? undefined,
    createdAt: r.createdAt.toISOString(),
  }));
}

// Add missing exports for API compatibility
export async function listOrdersByMarket(marketId: string) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  const rows = await prisma.order.findMany({ where: { marketId }, orderBy: { createdAt: "desc" } });
  return rows.map((r: any) => ({
    id: r.id,
    marketId: r.marketId,
    side: r.side,
    price: Number(r.price),
    size: Number(r.size),
    remaining: Number(r.remaining),
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function listTradesByMarket(marketId: string) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  const rows = await prisma.trade.findMany({ where: { marketId }, orderBy: { createdAt: "desc" } });
  return rows.map((r: any) => ({
    id: r.id,
    marketId: r.marketId,
    side: r.side,
    price: Number(r.avgPrice),
    size: Number(r.size),
    feesPaid: Number(r.feesPaid),
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function putOrder(order: {
  id: string;
  marketId: string;
  side: "Buy" | "Sell";
  price: number;
  size: number;
}) {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Prisma client not available");
  await prisma.order.create({
    data: {
      id: order.id,
      marketId: order.marketId,
      side: order.side,
      price: order.price,
      size: order.size,
      remaining: order.size,
      status: "Open",
      createdAt: new Date(),
    },
  });
}
