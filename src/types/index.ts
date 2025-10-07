export interface VaultMetrics {
  ethNetExposure: {
    value: number;
    dailyChange: number;
    dailyChangePercent: number;
  };
  totalLeverage: {
    value: number;
    dailyChange: number;
    weeklyChange: number;
  };
  liquidationPrice: {
    value: number;
    currentEthPrice: number;
    distance: number;
    isDangerZone: boolean;
  };
  vaultNav: {
    eth: number;
    usd: number;
    dailyChangePercent: number;
  };
  totalVaultValue: {
    usd: number;
    eth: number;
  };
  ethPrice: {
    current: number;
    dailyChange: number;
    dailyChangePercent: number;
  };
  currentPrices?: { [key: string]: number };
}

export interface PerformanceMetrics {
  inception: {
    returnPercent: number;
    returnUsd: number;
    returnEth: number;
  };
  daily: {
    returnPercent: number;
    returnUsd: number;
    returnEth: number;
  };
  monthly: {
    returnPercent: number;
    returnUsd: number;
    returnEth: number;
  };
}

export interface VaultActivity {
  dailyVolume: number;
  openPositions: number;
  recentTrades: Trade[];
  activities?: Trade[];
  totalTrades?: number;
  totalVolume?: number;
}

export interface Trade {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: Date;
  asset?: string;
  pnl?: number;
  fee?: number;
}

export interface VaultStatistics {
  volatility30d: number;
  volatility1y: number;
  openInterest: number;
  var95: number;
  var99: number;
}

export interface DataSource {
  name: string;
  url: string;
  lastUpdated: Date;
}

// CoinGecko API Types
export interface CoinGeckoPriceResponse {
  ethereum: {
    usd: number;
    usd_24h_change: number;
    usd_24h_vol: number;
    usd_market_cap: number;
  };
  bitcoin: {
    usd: number;
    usd_24h_change: number;
    usd_24h_vol?: number;
    usd_market_cap?: number;
  };
  [key: string]: {
    usd: number;
    usd_24h_change: number;
    usd_24h_vol?: number;
    usd_market_cap?: number;
  };
}

export interface CoinGeckoMarketChartResponse {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface ETHPriceData {
  current: number;
  dailyChange: number;
  dailyChangePercent: number;
  timestamp: number;
}

// Hyperliquid Vault API Types
export interface VaultDetails {
  name: string;
  vaultAddress: string;
  leader: string;
  description: string;
  portfolio: VaultPortfolioArray;
  apr: number;
  followerState: any;
  leaderFraction: number;
  leaderCommission: number;
  followers: VaultFollower[];
  maxDistributable: number;
  maxWithdrawable: number;
  isClosed: boolean;
  relationship?: VaultRelationship;
  allowDeposits: boolean;
  alwaysCloseOnWithdraw: boolean;
}

export interface VaultPortfolio {
  period: 'day' | 'week' | 'month' | 'allTime' | 'perpDay' | 'perpWeek' | 'perpMonth' | 'perpAllTime';
  data: {
    accountValueHistory: [number, string][];
    pnlHistory: [number, string][];
    vlm: string;
  };
}

// Portfolio array structure from API: [["day", {...}], ["week", {...}], ...]
export type VaultPortfolioArray = [
  string,
  {
    accountValueHistory: [number, string][];
    pnlHistory: [number, string][];
    vlm: string;
  }
][];

export interface VaultFollower {
  user: string;
  vaultEquity: string;
  pnl: string;
  allTimePnl: string;
  daysFollowing: number;
  vaultEntryTime: number;
  lockupUntil: number;
}

export interface VaultRelationship {
  type: 'parent' | 'child';
  data: {
    childAddresses?: string[];
    parentAddress?: string;
  };
}

export interface UserVaultEquities {
  user: string;
  vaultEquities: VaultEquity[];
}

export interface VaultEquity {
  vaultAddress: string;
  equity: string;
  pnl: string;
  allTimePnl: string;
  daysFollowing: number;
  vaultEntryTime: number;
  lockupUntil: number;
}

// Enhanced Vault Metrics for comprehensive display
export interface ComprehensiveVaultMetrics extends VaultMetrics {
  vaultDetails: VaultDetails;
  topDepositors: VaultFollower[];
  portfolioPerformance: PortfolioPerformance;
  riskMetrics: RiskMetrics;
}

export interface PortfolioPerformance {
  totalReturn: number;
  totalReturnPercent: number;
  dailyReturn: number;
  dailyReturnPercent: number;
  weeklyReturn: number;
  weeklyReturnPercent: number;
  monthlyReturn: number;
  monthlyReturnPercent: number;
  allTimeReturn: number;
  allTimeReturnPercent: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
}

export interface RiskMetrics {
  var95: number;
  var99: number;
  maxLeverage: number;
  currentLeverage: number;
  liquidationRisk: number;
  concentrationRisk: number;
  correlationRisk: number;
}
