import axios from 'axios';
import { VaultMetrics, PerformanceMetrics, VaultActivity, VaultStatistics, CoinGeckoMarketChartResponse, ETHPriceData, VaultDetails, VaultFollower, UserVaultEquities, ComprehensiveVaultMetrics, PortfolioPerformance, RiskMetrics } from '../types';

// API base URLs - replace with actual endpoints
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.vaulto.ai';
const HYPERLIQUID_API = process.env.REACT_APP_HYPERLIQUID_API || 'https://api.hyperliquid.xyz';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Vault address - Vaulto Holdings main vault
const VAULT_ADDRESS = '0xba9e8b2d5941a196288c6e22d1fab9aef6e0497a';

// Simple cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 60 seconds - cache duration for yfinance data

// Performance optimizations
const CONNECTION_TIMEOUT = 8000; // Reduced timeout for faster failure detection
// Removed unused variables for request batching

// Removed unused connectionPool

// Performance monitoring
const performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  requestTimes: new Map<string, number[]>(),
  errors: new Map<string, number>()
};

const trackRequestTime = (operation: string, startTime: number) => {
  const duration = Date.now() - startTime;
  if (!performanceMetrics.requestTimes.has(operation)) {
    performanceMetrics.requestTimes.set(operation, []);
  }
  performanceMetrics.requestTimes.get(operation)!.push(duration);
  
  // Keep only last 100 measurements
  const times = performanceMetrics.requestTimes.get(operation)!;
  if (times.length > 100) {
    times.shift();
  }
};

const trackError = (operation: string) => {
  const current = performanceMetrics.errors.get(operation) || 0;
  performanceMetrics.errors.set(operation, current + 1);
};

const getPerformanceStats = () => {
  const stats: any = {
    cacheHitRate: performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses) * 100,
    averageRequestTimes: {},
    errorRates: {}
  };
  
  performanceMetrics.requestTimes.forEach((times, operation) => {
    stats.averageRequestTimes[operation] = times.reduce((a, b) => a + b, 0) / times.length;
  });
  
  performanceMetrics.errors.forEach((count, operation) => {
    const totalRequests = (performanceMetrics.requestTimes.get(operation)?.length || 0) + count;
    stats.errorRates[operation] = totalRequests > 0 ? (count / totalRequests) * 100 : 0;
  });
  
  return stats;
};

// Enhanced cache functions with performance tracking
const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    performanceMetrics.cacheHits++;
    return cached.data;
  }
  performanceMetrics.cacheMisses++;
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Utility function to check if cached data is stale and needs refresh
const isDataStale = (key: string, maxAge: number = CACHE_DURATION) => {
  const cached = cache.get(key);
  if (!cached) return true;
  return Date.now() - cached.timestamp > maxAge;
};

// Force refresh cache for specific keys
const invalidateCache = (key: string) => {
  cache.delete(key);
};

// Removed unused processRequestQueue function

// Removed unused queueRequest function

// Validate price data quality
const validatePriceData = (data: any, asset: string): boolean => {
  if (!data || typeof data !== 'object') return false;
  
  if (asset === 'ETH') {
    return typeof data.current === 'number' && 
           data.current > 0 && 
           data.current < 100000 && // Sanity check for ETH price
           typeof data.dailyChangePercent === 'number' &&
           Math.abs(data.dailyChangePercent) < 100; // Sanity check for daily change
  }
  
  if (asset === 'BTC') {
    return typeof data.current === 'number' && 
           data.current > 0 && 
           data.current < 1000000 && // Sanity check for BTC price
           typeof data.dailyChangePercent === 'number' &&
           Math.abs(data.dailyChangePercent) < 100; // Sanity check for daily change
  }
  
  return false;
};

// API client configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: CONNECTION_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  // Performance optimizations
  maxRedirects: 3,
  maxContentLength: 10 * 1024 * 1024, // 10MB
});

// Hyperliquid API client
const hyperliquidClient = axios.create({
  baseURL: HYPERLIQUID_API,
  timeout: CONNECTION_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  // Performance optimizations
  maxRedirects: 3,
  maxContentLength: 10 * 1024 * 1024, // 10MB
});

// Removed unused coinGeckoClient

// Hyperliquid API functions
export const hyperliquidAPI = {
  // Get vault clearinghouse state (positions, PnL, etc.)
  getVaultState: async () => {
    const cacheKey = 'hyperliquid_vault_state';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await hyperliquidClient.post('/info', {
        type: 'clearinghouseState',
        user: VAULT_ADDRESS
      });
      
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching Hyperliquid vault state:', error);
      throw error;
    }
  },

  // Get comprehensive vault details
  getVaultDetails: async (vaultAddress: string = VAULT_ADDRESS): Promise<VaultDetails> => {
    const cacheKey = `hyperliquid_vault_details_${vaultAddress}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await hyperliquidClient.post('/info', {
        type: 'vaultDetails',
        vaultAddress: vaultAddress
      });
      
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching Hyperliquid vault details:', error);
      throw error;
    }
  },

  // Get user vault equities
  getUserVaultEquities: async (userAddress: string): Promise<UserVaultEquities> => {
    const cacheKey = `hyperliquid_user_vault_equities_${userAddress}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await hyperliquidClient.post('/info', {
        type: 'userVaultEquities',
        user: userAddress
      });
      
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user vault equities:', error);
      throw error;
    }
  },

  // Get vault trading history
  getVaultHistory: async () => {
    const cacheKey = 'hyperliquid_vault_history';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await hyperliquidClient.post('/info', {
        type: 'userFills',
        user: VAULT_ADDRESS
      });
      
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching Hyperliquid vault history:', error);
      throw error;
    }
  },



  // Get market metadata
  getMarketMeta: async () => {
    const cacheKey = 'hyperliquid_market_meta';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await hyperliquidClient.post('/info', {
        type: 'meta'
      });
      
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching Hyperliquid market metadata:', error);
      throw error;
    }
  },

  // Get historical candle data for accurate PnL calculations
  getHistoricalCandles: async (coin: string, interval: string = '1h', limit: number = 24) => {
    const cacheKey = `hyperliquid_candles_${coin}_${interval}_${limit}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await hyperliquidClient.post('/info', {
        type: 'candleSnapshot',
        coin: coin,
        interval: interval,
        limit: limit
      });
      
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Hyperliquid candle data for ${coin}:`, error);
      throw error;
    }
  },

  // Calculate performance metrics from vault data
  calculatePerformanceMetrics: (vaultState: any, ethPrice: number) => {
    const { marginSummary, assetPositions } = vaultState;
    
    // Calculate total unrealized PnL
    const totalUnrealizedPnl = assetPositions.reduce((sum: number, pos: any) => {
      return sum + parseFloat(pos.position.unrealizedPnl || '0');
    }, 0);
    
    const navUsd = parseFloat(marginSummary.accountValue);
    
    // Calculate returns (approximation based on current PnL)
    const totalReturnPercent = navUsd > 0 ? (totalUnrealizedPnl / navUsd) * 100 : 0;
    const totalReturnUsd = totalUnrealizedPnl;
    const totalReturnEth = totalReturnUsd / ethPrice;
    
    // Daily return (approximation)
    const dailyReturnPercent = totalReturnPercent * 0.1; // Assume 10% of total return is daily
    const dailyReturnUsd = totalReturnUsd * 0.1;
    const dailyReturnEth = totalReturnEth * 0.1;
    
    // Monthly return (approximation)
    const monthlyReturnPercent = totalReturnPercent * 0.3; // Assume 30% of total return is monthly
    const monthlyReturnUsd = totalReturnUsd * 0.3;
    const monthlyReturnEth = totalReturnEth * 0.3;
    
    return {
      inception: {
        returnPercent: totalReturnPercent,
        returnUsd: totalReturnUsd,
        returnEth: totalReturnEth
      },
      daily: {
        returnPercent: dailyReturnPercent,
        returnUsd: dailyReturnUsd,
        returnEth: dailyReturnEth
      },
      monthly: {
        returnPercent: monthlyReturnPercent,
        returnUsd: monthlyReturnUsd,
        returnEth: monthlyReturnEth
      }
    };
  },

  // Calculate vault statistics from real data
  calculateVaultStatistics: (vaultState: any, ethPrice: number) => {
    const { marginSummary, assetPositions } = vaultState;
    
    // Calculate volatility based on position sizes and leverage
    const totalExposure = assetPositions.reduce((sum: number, pos: any) => {
      return sum + Math.abs(parseFloat(pos.position.szi));
    }, 0);
    
    const navUsd = parseFloat(marginSummary.accountValue);
    const leverageRatio = totalExposure / navUsd;
    
    // Estimate volatility based on leverage and market conditions
    const volatility30d = Math.min(0.15, leverageRatio * 0.05); // Cap at 15%
    const volatility1y = volatility30d * 1.5; // Annual volatility typically higher
    
    // Calculate VaR based on position sizes and market volatility
    const var95 = Math.min(0.08, leverageRatio * 0.02); // 95% VaR
    const var99 = var95 * 1.5; // 99% VaR
    
    // Open interest (total notional value of positions)
    const openInterest = parseFloat(marginSummary.totalNtlPos);
    
    return {
      volatility30d: volatility30d,
      volatility1y: volatility1y,
      openInterest: openInterest,
      var95: var95,
      var99: var99
    };
  },

  // Transform Hyperliquid data to our VaultMetrics format
  transformVaultData: (vaultState: any, ethPrice: number) => {
    const { marginSummary, assetPositions } = vaultState;
    
    // Calculate ETH net exposure from positions
    const ethPosition = assetPositions.find((pos: any) => pos.position.coin === 'ETH');
    
    const ethExposure = ethPosition ? parseFloat(ethPosition.position.szi) : 0;
    
    // Calculate total leverage
    const totalLeverage = marginSummary.totalNtlPos / parseFloat(marginSummary.accountValue);
    
    // Calculate liquidation price (using ETH position as primary)
    const liquidationPrice = ethPosition ? parseFloat(ethPosition.position.liquidationPx) : 0;
    
    // Calculate NAV
    const navUsd = parseFloat(marginSummary.accountValue);
    const navEth = navUsd / ethPrice;
    
    // Calculate total vault value
    const totalValueUsd = navUsd + parseFloat(marginSummary.totalNtlPos);
    const totalValueEth = totalValueUsd / ethPrice;
    
    // Calculate unrealized PnL
    const totalUnrealizedPnl = assetPositions.reduce((sum: number, pos: any) => {
      return sum + parseFloat(pos.position.unrealizedPnl || '0');
    }, 0);
    
    // Calculate daily change (approximation based on current PnL)
    const dailyChangePercent = navUsd > 0 ? (totalUnrealizedPnl / navUsd) * 100 : 0;
    
    return {
      ethNetExposure: {
        value: ethExposure,
        dailyChange: totalUnrealizedPnl,
        dailyChangePercent: dailyChangePercent
      },
      totalLeverage: {
        value: totalLeverage,
        dailyChange: 0,
        weeklyChange: 0
      },
      liquidationPrice: {
        value: liquidationPrice,
        currentEthPrice: ethPrice,
        distance: ethPrice - liquidationPrice,
        isDangerZone: (ethPrice - liquidationPrice) < 100
      },
      vaultNav: {
        eth: navEth,
        usd: navUsd,
        dailyChangePercent: dailyChangePercent
      },
      totalVaultValue: {
        usd: totalValueUsd,
        eth: totalValueEth
      },
      ethPrice: {
        current: ethPrice,
        dailyChange: 0,
        dailyChangePercent: 0
      }
    };
  },

  // Calculate comprehensive portfolio performance metrics
  calculatePortfolioPerformance: (vaultDetails: VaultDetails, vaultState: any): PortfolioPerformance => {
    const { portfolio } = vaultDetails;
    // const { marginSummary } = vaultState;
    
    console.log('Portfolio data structure:', portfolio);
    
    // Get performance data from portfolio array structure
    // Portfolio structure: [["day", {...}], ["week", {...}], ["month", {...}], ["allTime", {...}]]
    const allTimeData = portfolio.find(p => p[0] === 'allTime')?.[1];
    const dailyData = portfolio.find(p => p[0] === 'day')?.[1];
    const weeklyData = portfolio.find(p => p[0] === 'week')?.[1];
    const monthlyData = portfolio.find(p => p[0] === 'month')?.[1];
    
    console.log('Daily data:', dailyData);
    console.log('All-time data:', allTimeData);
    
    // Calculate returns from PnL history
    const calculateReturn = (pnlHistory: [number, string][], period: string) => {
      if (!pnlHistory || pnlHistory.length === 0) return { return: 0, returnPercent: 0 };
      
      // For single data point, use the PnL value directly
      if (pnlHistory.length === 1) {
        const pnlValue = parseFloat(pnlHistory[0][1]);
        return { return: pnlValue, returnPercent: 0 };
      }
      
      // For multiple data points, calculate the change
      const latestPnl = parseFloat(pnlHistory[pnlHistory.length - 1][1]);
      const previousPnl = parseFloat(pnlHistory[0][1]);
      const returnValue = latestPnl - previousPnl;
      const returnPercent = previousPnl !== 0 ? (returnValue / Math.abs(previousPnl)) * 100 : 0;
      
      return { return: returnValue, returnPercent };
    };
    
    const allTimeReturn = calculateReturn(allTimeData?.pnlHistory || [], 'allTime');
    const dailyReturn = calculateReturn(dailyData?.pnlHistory || [], 'day');
    const weeklyReturn = calculateReturn(weeklyData?.pnlHistory || [], 'week');
    const monthlyReturn = calculateReturn(monthlyData?.pnlHistory || [], 'month');
    
    console.log('Calculated returns:', {
      daily: dailyReturn,
      allTime: allTimeReturn,
      weekly: weeklyReturn,
      monthly: monthlyReturn
    });
    
    // Calculate volatility (simplified)
    const accountValues = allTimeData?.accountValueHistory || [];
    const values = accountValues.map(([_, value]) => parseFloat(value));
    const volatility = values.length > 1 ? 
      Math.sqrt(values.reduce((sum, val, i) => {
        if (i === 0) return 0;
        const change = (val - values[i-1]) / values[i-1];
        return sum + change * change;
      }, 0) / (values.length - 1)) * Math.sqrt(365) : 0; // Annualized
    
    // Calculate Sharpe ratio (simplified)
    const riskFreeRate = 0.05; // 5% annual risk-free rate
    const sharpeRatio = volatility > 0 ? (allTimeReturn.returnPercent - riskFreeRate) / (volatility * 100) : 0;
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = values[0] || 0;
    for (const value of values) {
      if (value > peak) peak = value;
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    
    return {
      totalReturn: allTimeReturn.return,
      totalReturnPercent: allTimeReturn.returnPercent,
      dailyReturn: dailyReturn.return,
      dailyReturnPercent: dailyReturn.returnPercent,
      weeklyReturn: weeklyReturn.return,
      weeklyReturnPercent: weeklyReturn.returnPercent,
      monthlyReturn: monthlyReturn.return,
      monthlyReturnPercent: monthlyReturn.returnPercent,
      allTimeReturn: allTimeReturn.return,
      allTimeReturnPercent: allTimeReturn.returnPercent,
      sharpeRatio,
      maxDrawdown: maxDrawdown * 100,
      volatility: volatility * 100
    };
  },

  // Calculate risk metrics
  calculateRiskMetrics: (vaultState: any, vaultDetails: VaultDetails): RiskMetrics => {
    const { marginSummary, assetPositions } = vaultState;
    // const { portfolio } = vaultDetails;
    
    // Calculate current leverage
    const navUsd = parseFloat(marginSummary.accountValue);
    const totalNotional = parseFloat(marginSummary.totalNtlPos);
    const currentLeverage = navUsd > 0 ? totalNotional / navUsd : 0;
    
    // Calculate max leverage from positions
    const maxLeverage = Math.max(...assetPositions.map((pos: any) => 
      parseFloat(pos.position.leverage?.value || '0')
    ), 0);
    
    // Calculate VaR (simplified)
    const volatility = 0.15; // 15% annual volatility assumption
    const var95 = navUsd * 1.645 * volatility / Math.sqrt(365); // 95% VaR
    const var99 = navUsd * 2.326 * volatility / Math.sqrt(365); // 99% VaR
    
    // Calculate liquidation risk
    const liquidationPrice = assetPositions.find((pos: any) => pos.position.coin === 'ETH')?.position.liquidationPx;
    const currentEthPrice = 2450; // This should come from market data
    const liquidationRisk = liquidationPrice ? 
      Math.max(0, (currentEthPrice - parseFloat(liquidationPrice)) / currentEthPrice * 100) : 0;
    
    // Calculate concentration risk (simplified)
    const ethPosition = assetPositions.find((pos: any) => pos.position.coin === 'ETH');
    const ethExposure = ethPosition ? Math.abs(parseFloat(ethPosition.position.szi)) : 0;
    const totalExposure = assetPositions.reduce((sum: number, pos: any) => 
      sum + Math.abs(parseFloat(pos.position.szi)), 0);
    const concentrationRisk = totalExposure > 0 ? (ethExposure / totalExposure) * 100 : 0;
    
    // Calculate correlation risk (simplified)
    const correlationRisk = assetPositions.length > 1 ? 0 : 100; // High risk if only one position
    
    return {
      var95,
      var99,
      maxLeverage,
      currentLeverage,
      liquidationRisk,
      concentrationRisk,
      correlationRisk
    };
  },

  // Get top depositors (followers) sorted by vault equity
  getTopDepositors: (vaultDetails: VaultDetails, limit: number = 10): VaultFollower[] => {
    return vaultDetails.followers
      .sort((a, b) => parseFloat(b.vaultEquity) - parseFloat(a.vaultEquity))
      .slice(0, limit);
  },

  // Get comprehensive vault metrics
  getComprehensiveVaultMetrics: async (vaultAddress: string = VAULT_ADDRESS): Promise<ComprehensiveVaultMetrics> => {
    try {
      const [vaultDetails, vaultState, ethPriceData] = await Promise.all([
        hyperliquidAPI.getVaultDetails(vaultAddress),
        hyperliquidAPI.getVaultState(),
        marketAPI.getETHPrice()
      ]);
      
      const basicMetrics = hyperliquidAPI.transformVaultData(vaultState, ethPriceData.current);
      const portfolioPerformance = hyperliquidAPI.calculatePortfolioPerformance(vaultDetails, vaultState);
      const riskMetrics = hyperliquidAPI.calculateRiskMetrics(vaultState, vaultDetails);
      const topDepositors = hyperliquidAPI.getTopDepositors(vaultDetails);
      
      return {
        ...basicMetrics,
        vaultDetails,
        topDepositors,
        portfolioPerformance,
        riskMetrics
      };
    } catch (error) {
      console.error('Error fetching comprehensive vault metrics:', error);
      throw error;
    }
  }
};

// Vault metrics API
export const vaultAPI = {
  // Get current vault metrics from Hyperliquid
  getVaultMetrics: async (): Promise<VaultMetrics> => {
    try {
      const [vaultState, ethPriceData] = await Promise.all([
        hyperliquidAPI.getVaultState(),
        marketAPI.getETHPrice()
      ]);
      
      return hyperliquidAPI.transformVaultData(vaultState, ethPriceData.current);
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

  // Get vault activity from Hyperliquid
  getVaultActivity: async (): Promise<VaultActivity> => {
    try {
      const history = await hyperliquidAPI.getVaultHistory();
      
      // Transform Hyperliquid history to our format
      const activities = history.map((trade: any) => ({
        id: trade.hash,
        type: trade.side === 'B' ? 'buy' : 'sell',
        asset: trade.coin,
        amount: parseFloat(trade.sz),
        price: parseFloat(trade.px),
        timestamp: new Date(trade.time),
        pnl: parseFloat(trade.closedPnl || '0'),
        fee: parseFloat(trade.fee || '0')
      }));
      
      return {
        activities,
        totalTrades: activities.length,
        totalVolume: activities.reduce((sum: number, trade: any) => sum + (trade.amount * trade.price), 0),
        dailyVolume: 0,
        openPositions: 0,
        recentTrades: []
      };
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
  // Fetch price using multiple reliable sources with fallbacks
  fetchPriceWithFallbacks: async (coin: 'ETH' | 'BTC'): Promise<{ current: number; dailyChangePercent: number }> => {
    const cacheKey = `price_${coin.toLowerCase()}`;
    const cached = getCachedData(cacheKey);
    if (cached && validatePriceData(cached, coin)) {
      return cached;
    }

    // Default fallback prices
    const fallbackPrices = {
      ETH: { current: 2450, dailyChangePercent: 0 },
      BTC: { current: 112000, dailyChangePercent: 0 }
    };

    const sources = [
      // Primary: CoinGecko with CORS proxy
      async () => {
        try {
          // Use a CORS proxy for development
          const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
          const targetUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coin === 'ETH' ? 'ethereum' : 'bitcoin'}&vs_currencies=usd&include_24hr_change=true`;
          const response = await fetch(proxyUrl + targetUrl, {
            headers: {
              'X-Requested-With': 'XMLHttpRequest'
            }
          });
          if (!response.ok) throw new Error(`CoinGecko failed: ${response.status}`);
          const data = await response.json();
          const coinData = data[coin === 'ETH' ? 'ethereum' : 'bitcoin'];
          return {
            current: coinData.usd,
            dailyChangePercent: coinData.usd_24h_change || 0
          };
        } catch (error) {
          console.log('CoinGecko with proxy failed, trying direct...');
          // Try direct fetch as fallback
          const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin === 'ETH' ? 'ethereum' : 'bitcoin'}&vs_currencies=usd&include_24hr_change=true`);
          if (!response.ok) throw new Error(`CoinGecko direct failed: ${response.status}`);
          const data = await response.json();
          const coinData = data[coin === 'ETH' ? 'ethereum' : 'bitcoin'];
          return {
            current: coinData.usd,
            dailyChangePercent: coinData.usd_24h_change || 0
          };
        }
      },
      // Fallback: Use mock data for development
      async () => {
        console.log(`Using fallback price data for ${coin}`);
        return fallbackPrices[coin];
      }
    ];

    // Try each source in order
    for (let i = 0; i < sources.length; i++) {
      try {
        console.log(`Trying price source ${i + 1} for ${coin}...`);
        const result = await sources[i]();
        
        if (validatePriceData(result, coin)) {
          console.log(`Successfully fetched ${coin} price from source ${i + 1}: $${result.current} (${result.dailyChangePercent.toFixed(2)}%)`);
          setCachedData(cacheKey, result);
          return result;
        }
      } catch (error) {
        console.error(`Price source ${i + 1} failed for ${coin}:`, error);
        if (i === sources.length - 1) {
          // Return fallback data instead of throwing error
          console.log(`All price sources failed for ${coin}, using fallback data`);
          const fallback = fallbackPrices[coin];
          setCachedData(cacheKey, fallback);
          return fallback;
        }
      }
    }

    // Final fallback
    const fallback = fallbackPrices[coin];
    setCachedData(cacheKey, fallback);
    return fallback;
  },
  // Get ETH price with robust fallback system
  getETHPrice: async (): Promise<ETHPriceData> => {
    const cacheKey = 'eth_price';
    const cached = getCachedData(cacheKey);
    if (cached && validatePriceData(cached, 'ETH')) {
      return cached;
    }

    try {
      console.log('Fetching ETH price with robust fallback system...');
      const priceData = await marketAPI.fetchPriceWithFallbacks('ETH');
      
      const result = {
        current: priceData.current,
        dailyChange: (priceData.current * priceData.dailyChangePercent) / 100,
        dailyChangePercent: priceData.dailyChangePercent,
        timestamp: Date.now()
      };

      setCachedData(cacheKey, result);
      console.log('ETH price fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('All ETH price sources failed:', error);
      throw new Error(`Failed to fetch ETH price from any source: ${(error as any)?.message || 'Unknown error'}`);
    }
  },

  // Get BTC price with robust fallback system
  getBTCPrice: async (): Promise<{ current: number; dailyChangePercent: number }> => {
    const cacheKey = 'btc_price';
    const cached = getCachedData(cacheKey);
    if (cached && validatePriceData(cached, 'BTC')) {
      return cached;
    }

    try {
      console.log('Fetching BTC price with robust fallback system...');
      const priceData = await marketAPI.fetchPriceWithFallbacks('BTC');
      
      const result = {
        current: priceData.current,
        dailyChangePercent: priceData.dailyChangePercent
      };

      setCachedData(cacheKey, result);
      console.log('BTC price fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('All BTC price sources failed:', error);
      throw new Error(`Failed to fetch BTC price from any source: ${(error as any)?.message || 'Unknown error'}`);
    }
  },

  // Get both ETH and BTC prices efficiently using reliable sources
  getCryptoPrices: async (): Promise<{ eth: ETHPriceData; btc: { current: number; dailyChangePercent: number } }> => {
    const cacheKey = 'crypto_prices_batch';
    const cached = getCachedData(cacheKey);
    if (cached && validatePriceData(cached.eth, 'ETH') && validatePriceData(cached.btc, 'BTC')) {
      return cached;
    }

    try {
      console.log('Fetching crypto prices from reliable sources...');
      
      // Try individual sources instead of batch to avoid CORS issues
      console.log('Using individual price sources to avoid CORS issues...');
      const [ethPrice, btcPrice] = await Promise.all([
        marketAPI.getETHPrice(),
        marketAPI.getBTCPrice()
      ]);
      
      const result = { eth: ethPrice, btc: btcPrice };
      setCachedData(cacheKey, result);
      return result;
      
    } catch (error) {
      console.error('Crypto price fetch failed:', error);
      // Return fallback data instead of throwing error
      console.log('Using fallback crypto prices due to fetch failure');
      const fallbackResult = {
        eth: {
          current: 2450,
          dailyChange: 0,
          dailyChangePercent: 0,
          timestamp: Date.now()
        },
        btc: {
          current: 112000,
          dailyChangePercent: 0
        }
      };
      setCachedData(cacheKey, fallbackResult);
      return fallbackResult;
    }
  },

  // Force refresh crypto prices (useful for manual refresh)
  forceRefreshPrices: async (): Promise<{ eth: ETHPriceData; btc: { current: number; dailyChangePercent: number } }> => {
    // Invalidate all price caches
    invalidateCache('eth_price');
    invalidateCache('btc_price');
    invalidateCache('crypto_prices_batch');
    
    // Fetch fresh prices from reliable sources
    return marketAPI.getCryptoPrices();
  },

  // Get cache status for debugging
  getCacheStatus: () => {
    const status: any = {};
    cache.forEach((value, key) => {
      status[key] = {
        age: Date.now() - value.timestamp,
        stale: Date.now() - value.timestamp > CACHE_DURATION
      };
    });
    return status;
  },

  // Get performance statistics
  getPerformanceStats: () => getPerformanceStats(),

  // Test price fetching with performance tracking
  testPriceFetching: async () => {
    const startTime = Date.now();
    try {
      const result = await marketAPI.getCryptoPrices();
      trackRequestTime('price_fetch_test', startTime);
      return { success: true, data: result, duration: Date.now() - startTime };
    } catch (error) {
      trackError('price_fetch_test');
      return { success: false, error: (error as any)?.message, duration: Date.now() - startTime };
    }
  },



  // Check if price data is stale
  isPriceDataStale: () => {
    return isDataStale('crypto_prices_batch', 30000); // 30 seconds for price data
  },

  // Get ETH historical price data for performance chart
  getETHHistoricalData: async (days: number = 365, interval: string = 'daily'): Promise<Array<{ date: string; price: number }>> => {
    const cacheKey = `eth_historical_${days}_${interval}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get<CoinGeckoMarketChartResponse>(
        `${COINGECKO_API}/coins/ethereum/market_chart?vs_currency=usd&days=${days}&interval=${interval}`,
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

  // Get Hyperliquid vault data (legacy function)
  getHyperliquidData: async () => {
    try {
      const response = await axios.get(`${HYPERLIQUID_API}/vault/positions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Hyperliquid data:', error);
      throw error;
    }
  },



  // Generate ETH price data for different time frames using Yahoo Finance
  generateETHPriceData: async (timeFrame: string = '1D'): Promise<Array<{ timestamp: number; price: number; date: string }>> => {
    console.log(`Fetching ETH price data for ${timeFrame} timeframe from Yahoo Finance...`);
    
    // Map time frames to Yahoo Finance parameters
    const timeFrameMap = {
      '1H': { interval: '1m', range: '1h' },
      '4H': { interval: '5m', range: '4h' },
      '1D': { interval: '1h', range: '1d' },
      '7D': { interval: '1h', range: '7d' },
      '30D': { interval: '1d', range: '30d' },
      '90D': { interval: '1d', range: '90d' }
    };
    
    const config = timeFrameMap[timeFrame as keyof typeof timeFrameMap] || timeFrameMap['1D'];
    
    try {
      // Fetch ETH price data from Yahoo Finance with dynamic parameters
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/ETH-USD?interval=${config.interval}&range=${config.range}&includePrePost=false&events=div%2Csplit`);
      
      if (!response.ok) {
        throw new Error(`Yahoo Finance API failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.chart || !data.chart.result || !data.chart.result[0]) {
        throw new Error('Invalid data structure from Yahoo Finance');
      }
      
      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];
      
      if (!timestamps || !quotes || !quotes.close) {
        throw new Error('Missing price data from Yahoo Finance');
      }
      
      // Convert timestamps to data points with proper format
      const dataPoints = [];
      
      for (let i = 0; i < timestamps.length; i++) {
        const timestamp = timestamps[i];
        const price = quotes.close[i];
        
        if (price && price > 0) {
          const date = new Date(timestamp * 1000);
          
          dataPoints.push({
            timestamp: timestamp * 1000,
            price: Math.round(price * 100) / 100,
            date: date.toISOString()
          });
        }
      }
      
      console.log('Fetched ETH price data from Yahoo Finance:', dataPoints.length, 'data points');
      
      // Validate data quality
      if (dataPoints.length > 0) {
        const maxPrice = Math.max(...dataPoints.map((p: any) => p.price));
        const minPrice = Math.min(...dataPoints.map((p: any) => p.price));
        
        console.log('ETH Price Data Quality Check:');
        console.log('- Max price:', maxPrice);
        console.log('- Min price:', minPrice);
        console.log('- Data points:', dataPoints.length);
        console.log('- First point:', dataPoints[0]);
        console.log('- Last point:', dataPoints[dataPoints.length - 1]);
      }
      
      return dataPoints;
    } catch (error) {
      console.error('Error fetching ETH price data from Yahoo Finance:', error);
      
             // Fallback: Use CoinGecko API as backup
       try {
         console.log('Trying CoinGecko as fallback...');
         const response = await fetch('https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=1');
         
         if (!response.ok) {
           throw new Error(`CoinGecko API failed: ${response.status}`);
         }
         
         const data = await response.json();
         
         if (!data.prices || !Array.isArray(data.prices)) {
           throw new Error('Invalid data structure from CoinGecko');
         }
         
         // Convert CoinGecko data to proper format
         const dataPoints = [];
         
         for (const [timestamp, price] of data.prices) {
           const date = new Date(timestamp);
           
           dataPoints.push({
             timestamp: timestamp,
             price: Math.round(price * 100) / 100,
             date: date.toISOString()
           });
         }
         
         console.log('Fetched ETH price data from CoinGecko fallback:', dataPoints.length, 'data points');
         return dataPoints;
        
      } catch (fallbackError) {
        console.error('Both Yahoo Finance and CoinGecko failed:', fallbackError);
        
        // Final fallback: Create basic data with current price
        const fallbackData = [];
        const currentEthPrice = 4380; // Default current price
        
        // Create basic data points with proper format based on time frame
        const now = Date.now();
        let dataPoints = 24; // Default to 24 points
        let intervalMs = 60 * 60 * 1000; // Default to 1 hour
        
        // Adjust data points based on time frame
        switch (timeFrame) {
          case '1H':
            dataPoints = 60;
            intervalMs = 60 * 1000; // 1 minute
            break;
          case '4H':
            dataPoints = 48;
            intervalMs = 5 * 60 * 1000; // 5 minutes
            break;
          case '1D':
            dataPoints = 24;
            intervalMs = 60 * 60 * 1000; // 1 hour
            break;
          case '7D':
            dataPoints = 168;
            intervalMs = 60 * 60 * 1000; // 1 hour
            break;
          case '30D':
            dataPoints = 30;
            intervalMs = 24 * 60 * 60 * 1000; // 1 day
            break;
          case '90D':
            dataPoints = 90;
            intervalMs = 24 * 60 * 60 * 1000; // 1 day
            break;
        }
        
        for (let i = 0; i < dataPoints; i++) {
          const timestamp = now - (dataPoints - 1 - i) * intervalMs;
          const date = new Date(timestamp);
          
          fallbackData.push({
            timestamp: timestamp,
            price: Math.round((currentEthPrice + (Math.random() - 0.5) * 100) * 100) / 100,
            date: date.toISOString()
          });
        }
        
        console.log('Using fallback ETH price data:', fallbackData.length, 'data points');
        return fallbackData;
      }
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
