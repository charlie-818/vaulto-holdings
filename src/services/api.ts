import axios from 'axios';
import { VaultMetrics, PerformanceMetrics, VaultActivity, VaultStatistics, CoinGeckoPriceResponse, CoinGeckoMarketChartResponse, ETHPriceData } from '../types';

// API base URLs - replace with actual endpoints
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.vaulto.ai';
const HYPERLIQUID_API = process.env.REACT_APP_HYPERLIQUID_API || 'https://api.hyperliquid.xyz';
const CHAINLINK_API = process.env.REACT_APP_CHAINLINK_API || 'https://api.chainlink.org';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Simple cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// API client configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Vault metrics API
export const vaultAPI = {
  // Get current vault metrics
  getVaultMetrics: async (): Promise<VaultMetrics> => {
    try {
      const response = await apiClient.get('/vault/metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching vault metrics:', error);
      throw error;
    }
  },

  // Get performance metrics
  getPerformanceMetrics: async (): Promise<PerformanceMetrics> => {
    try {
      const response = await apiClient.get('/vault/performance');
      return response.data;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw error;
    }
  },

  // Get vault activity
  getVaultActivity: async (): Promise<VaultActivity> => {
    try {
      const response = await apiClient.get('/vault/activity');
      return response.data;
    } catch (error) {
      console.error('Error fetching vault activity:', error);
      throw error;
    }
  },

  // Get vault statistics
  getVaultStatistics: async (): Promise<VaultStatistics> => {
    try {
      const response = await apiClient.get('/vault/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching vault statistics:', error);
      throw error;
    }
  },
};

// Market data API
export const marketAPI = {
  // Get ETH price from CoinGecko
  getETHPrice: async (): Promise<ETHPriceData> => {
    const cacheKey = 'eth_price';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get<CoinGeckoPriceResponse>(
        `${COINGECKO_API}/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
        {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Vaulto-Dashboard/1.0'
          }
        }
      );
      
      const ethData = response.data.ethereum;
      const currentPrice = ethData.usd;
      const dailyChangePercent = ethData.usd_24h_change;
      const dailyChange = (currentPrice * dailyChangePercent) / 100;
      
      const result = {
        current: currentPrice,
        dailyChange: dailyChange,
        dailyChangePercent: dailyChangePercent,
        timestamp: Date.now()
      };

      setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching ETH price from CoinGecko:', error);
      // Return fallback data if API fails
      const fallback = {
        current: 2450.75,
        dailyChange: 45.25,
        dailyChangePercent: 1.88,
        timestamp: Date.now()
      };
      setCachedData(cacheKey, fallback);
      return fallback;
    }
  },

  // Get ETH historical price data for performance chart
  getETHHistoricalData: async (days: number = 365): Promise<Array<{ date: string; price: number }>> => {
    const cacheKey = `eth_historical_${days}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get<CoinGeckoMarketChartResponse>(
        `${COINGECKO_API}/coins/ethereum/market_chart?vs_currency=usd&days=${days}&interval=daily`,
        {
          timeout: 15000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Vaulto-Dashboard/1.0'
          }
        }
      );
      
      // Keep daily data points for accuracy, but format dates consistently
      const result = response.data.prices.map(([timestamp, price]) => ({
        date: new Date(timestamp).toISOString().split('T')[0],
        price: price
      }));

      setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching ETH historical data:', error);
      // Return fallback data if API fails
      const fallbackData = [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        fallbackData.push({
          date: date.toISOString().split('T')[0],
          price: 2450 + Math.random() * 100
        });
      }
      
      setCachedData(cacheKey, fallbackData);
      return fallbackData;
    }
  },

  // Get Hyperliquid vault data
  getHyperliquidData: async () => {
    try {
      const response = await axios.get(`${HYPERLIQUID_API}/vault/positions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Hyperliquid data:', error);
      throw error;
    }
  },
};

// WebSocket connection for real-time updates
export const createWebSocketConnection = (onDataUpdate: (data: any) => void) => {
  const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'wss://ws.vaulto.ai');
  
  ws.onopen = () => {
    console.log('WebSocket connected');
    // Subscribe to real-time updates
    ws.send(JSON.stringify({
      type: 'subscribe',
      channels: ['vault_metrics', 'eth_price', 'performance']
    }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onDataUpdate(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    // Implement reconnection logic
    setTimeout(() => {
      createWebSocketConnection(onDataUpdate);
    }, 5000);
  };

  return ws;
};

// Data polling service for fallback
export const createDataPoller = (
  fetchFunction: () => Promise<any>,
  interval: number = 30000,
  onDataUpdate: (data: any) => void
) => {
  let intervalId: NodeJS.Timeout;

  const start = () => {
    intervalId = setInterval(async () => {
      try {
        const data = await fetchFunction();
        onDataUpdate(data);
      } catch (error) {
        console.error('Error in data polling:', error);
      }
    }, interval);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };

  return { start, stop };
};
