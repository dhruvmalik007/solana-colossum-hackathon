import { NextRequest, NextResponse } from "next/server";
import { putCreatorProfile } from "@repo/database";

export async function POST(req: NextRequest) {
  try {
    const { userId, walletAddress, role, displayName, bio, website, portfolioStats } = await req.json();
    if (!userId || !walletAddress || !role) {
      return NextResponse.json({ error: "Missing required fields: userId, walletAddress, role" }, { status: 400 });
    }
    const profile = { userId, walletAddress, role, displayName, bio, website, portfolioStats, verificationStatus: "pending" as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await putCreatorProfile(profile);
    return NextResponse.json({ data: profile, message: "Creator profile created successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed to create creator profile" }, { status: 500 });
  }
}
