import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the database module
vi.mock("@repo/database", () => ({
  listCreatorProfiles: vi.fn(async () => [
    { userId: "u1", walletAddress: "wa", role: "creator", portfolioConnected: true, verificationStatus: "verified", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]),
  getCreatorProfile: vi.fn(async (id: string) => id === "u1" ? ({ userId: "u1", walletAddress: "wa", role: "creator", portfolioConnected: true, verificationStatus: "verified", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }) : null),
}));

import { GET as GET_LIST } from "../app/creator-profiles/route";
import { GET as GET_DETAIL } from "../app/creator-profiles/[id]/route";

function makeReq(url: string): any { return { url }; }

describe("creator-profiles routes", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("GET /creator-profiles returns data list", async () => {
    const res = await GET_LIST(makeReq("https://api.local/creator-profiles?page=1&pageSize=5&q=holy"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("GET /creator-profiles/[id] returns 404 for missing profile", async () => {
    const res = await GET_DETAIL(makeReq("https://api.local/creator-profiles/u2"), { params: { id: "u2" } });
    expect(res.status).toBe(404);
  });

  it("GET /creator-profiles/[id] returns profile for existing id", async () => {
    const res = await GET_DETAIL(makeReq("https://api.local/creator-profiles/u1"), { params: { id: "u1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.data?.userId).toBe("u1");
  });
});
