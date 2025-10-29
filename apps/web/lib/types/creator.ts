export type CreatorRole = "creator" | "participant" | "both";

export type CreatorOnboardingStep = "role-select" | "portfolio-connect" | "credentials-verify" | "profile-setup" | "complete";

export type CreatorProfile = {
  userId: string;
  walletAddress: string;
  role: CreatorRole;
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

export type PortfolioData = {
  walletAddress: string;
  solBalance: number;
  tokenHoldings: Array<{
    mint: string;
    symbol: string;
    amount: number;
    value: number;
  }>;
  nftHoldings: number;
  stakingInfo?: {
    stakedSol: number;
    rewards: number;
  };
  defiPositions?: Array<{
    protocol: string;
    type: string;
    value: number;
  }>;
};
