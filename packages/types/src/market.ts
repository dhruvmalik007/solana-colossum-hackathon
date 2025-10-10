export type DistributionType = 'gaussian' | 'lognormal' | 'bimodal' | 'uniform' | 'custom';

export type DistributionParams = {
  type: DistributionType;
  mean?: number;
  stdDev?: number;
  components?: { weight: number; mean: number; stdDev: number }[];
  range: [number, number];
  step: number;
  unit: string;
};

export type OracleType = 'chainlink' | 'pyth' | 'switchboard' | 'manual';

export interface MarketMeta {
  slug: string;
  title: string;
  description: string;
  category: string[];
  tags: string[];
}
