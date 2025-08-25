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
