import { VaultMetrics, PerformanceMetrics, VaultActivity, VaultStatistics, DataSource } from '../types';

export const mockVaultMetrics: VaultMetrics = {
  ethNetExposure: {
    value: 4.5,
    dailyChange: 0.0,
    dailyChangePercent: 0.0
  },
  totalLeverage: {
    value: 4.5,
    dailyChange: 0.0,
    weeklyChange: 0.0
  },
  liquidationPrice: {
    value: 544.61,
    currentEthPrice: 2450.75,
    distance: 1906.14,
    isDangerZone: false
  },
  vaultNav: {
    eth: 4.08,
    usd: 10000.00,
    dailyChangePercent: 0.0
  },
  totalVaultValue: {
    usd: 45000.00,
    eth: 18.36
  },
  ethPrice: {
    current: 2450.75,
    dailyChange: 45.25,
    dailyChangePercent: 1.88
  }
};

export const mockPerformanceMetrics: PerformanceMetrics = {
  inception: {
    returnPercent: 402.39,
    returnUsd: 21213.67,
    returnEth: 8.64
  },
  daily: {
    returnPercent: 8.46,
    returnUsd: 846.00,
    returnEth: 0.345
  },
  monthly: {
    returnPercent: 84.38,
    returnUsd: 8437.50,
    returnEth: 3.44
  }
};

export const mockVaultActivity: VaultActivity = {
  dailyVolume: 1876.90,
  openPositions: 1,
  recentTrades: [
    {
      id: 'tx_001',
      type: 'buy',
      amount: 0.018,
      price: 2445.30,
      timestamp: new Date(Date.now() - 5 * 60 * 1000)
    },
    {
      id: 'tx_002',
      type: 'sell',
      amount: 0.009,
      price: 2452.10,
      timestamp: new Date(Date.now() - 12 * 60 * 1000)
    },
    {
      id: 'tx_003',
      type: 'buy',
      amount: 0.027,
      price: 2438.75,
      timestamp: new Date(Date.now() - 25 * 60 * 1000)
    }
  ]
};

export const mockVaultStatistics: VaultStatistics = {
  volatility30d: 0.045,
  volatility1y: 0.067,
  openInterest: 8900000,
  var95: 0.023,
  var99: 0.034
};

export const mockDataSources: DataSource[] = [
  {
    name: 'CoinGecko',
    url: 'https://coingecko.com',
    lastUpdated: new Date()
  },
  {
    name: 'Hyperliquid',
    url: 'https://hyperliquid.xyz',
    lastUpdated: new Date(Date.now() - 30 * 1000)
  },
  {
    name: 'Chainlink',
    url: 'https://chainlink.org',
    lastUpdated: new Date(Date.now() - 60 * 1000)
  }
];
