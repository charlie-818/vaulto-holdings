import { ETHPriceData } from '../types';

// Types for the new price service
export interface CryptoPrice {
  current: number;
  dailyChange: number;
  dailyChangePercent: number;
  timestamp: number;
  source: string;
}

export interface PriceServiceConfig {
  cacheTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  fallbackPrices: {
    ETH: CryptoPrice;
    BTC: CryptoPrice;
  };
}

// Default configuration with aggressive caching
const DEFAULT_CONFIG: PriceServiceConfig = {
  cacheTimeout: 60000, // 60 seconds - longer cache to reduce API calls
  retryAttempts: 3, // More retries for better reliability
  retryDelay: 1500, // Longer delay between retries
  fallbackPrices: {
    ETH: {
      current: 3000,
      dailyChange: 0,
      dailyChangePercent: 0,
      timestamp: Date.now(),
      source: 'fallback'
    },
    BTC: {
      current: 80000,
      dailyChange: 0,
      dailyChangePercent: 0,
      timestamp: Date.now(),
      source: 'fallback'
    }
  }
};

// Enhanced cache with TTL, validation, and localStorage persistence
class PriceCache {
  private cache = new Map<string, { data: CryptoPrice; expiry: number }>();
  private readonly defaultTTL: number;
  private readonly storageKey = 'vaulto_price_cache';

  constructor(defaultTTL: number = 30000) {
    this.defaultTTL = defaultTTL;
    this.loadFromLocalStorage();
  }

  // Load cache from localStorage on initialization
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        
        // Only load non-expired entries
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          if (value.expiry > now) {
            this.cache.set(key, value);
          }
        });
        
        console.log('📦 Loaded cached prices from localStorage:', this.cache.size, 'entries');
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  // Save cache to localStorage
  private saveToLocalStorage(): void {
    try {
      const cacheObject: any = {};
      this.cache.forEach((value, key) => {
        cacheObject[key] = value;
      });
      localStorage.setItem(this.storageKey, JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  set(key: string, data: CryptoPrice, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiry });
    this.saveToLocalStorage();
  }

  get(key: string): CryptoPrice | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      this.saveToLocalStorage();
      return null;
    }
    
    return cached.data;
  }

  // Get cached price even if expired (for use as last-resort fallback)
  getEvenIfExpired(key: string): CryptoPrice | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
    localStorage.removeItem(this.storageKey);
  }

  size(): number {
    return this.cache.size;
  }
}

// Price validation utilities
class PriceValidator {
  static validateETHPrice(price: CryptoPrice): boolean {
    return (
      price.current > 500 && price.current < 10000 &&
      Math.abs(price.dailyChangePercent) < 50 &&
      typeof price.current === 'number' &&
      typeof price.dailyChangePercent === 'number' &&
      !isNaN(price.current) &&
      !isNaN(price.dailyChangePercent)
    );
  }

  static validateBTCPrice(price: CryptoPrice): boolean {
    return (
      price.current > 10000 && price.current < 150000 &&
      Math.abs(price.dailyChangePercent) < 50 &&
      typeof price.current === 'number' &&
      typeof price.dailyChangePercent === 'number' &&
      !isNaN(price.current) &&
      !isNaN(price.dailyChangePercent)
    );
  }

  static validatePrice(price: CryptoPrice, asset: 'ETH' | 'BTC'): boolean {
    if (asset === 'ETH') return this.validateETHPrice(price);
    if (asset === 'BTC') return this.validateBTCPrice(price);
    return false;
  }
}

// Simple retry utility
async function retry<T>(
  fn: () => Promise<T>,
  attempts: number = 2,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// Main Price Service Class
export class PriceService {
  private cache: PriceCache;
  private config: PriceServiceConfig;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(config: Partial<PriceServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new PriceCache(this.config.cacheTimeout);
  }

  // Initialize the service with fresh data
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    await this.initializationPromise;
    this.isInitialized = true;
  }

  private async performInitialization(): Promise<void> {
    console.log('🚀 Initializing Price Service...');
    
    try {
      // Fetch both ETH and BTC prices in parallel for fast initialization
      const [ethPrice, btcPrice] = await Promise.allSettled([
        this.fetchETHPriceFromPrimarySource(),
        this.fetchBTCPriceFromPrimarySource()
      ]);

      // Handle ETH price
      if (ethPrice.status === 'fulfilled') {
        this.cache.set('ETH', ethPrice.value);
        console.log('✅ ETH price initialized:', ethPrice.value);
      } else {
        console.warn('⚠️ ETH price initialization failed, using fallback');
        this.cache.set('ETH', this.config.fallbackPrices.ETH);
      }

      // Handle BTC price
      if (btcPrice.status === 'fulfilled') {
        this.cache.set('BTC', btcPrice.value);
        console.log('✅ BTC price initialized:', btcPrice.value);
      } else {
        console.warn('⚠️ BTC price initialization failed, using fallback');
        this.cache.set('BTC', this.config.fallbackPrices.BTC);
      }

      console.log('🎯 Price Service initialized successfully');
    } catch (error) {
      console.error('❌ Price Service initialization failed:', error);
      // Set fallback prices
      this.cache.set('ETH', this.config.fallbackPrices.ETH);
      this.cache.set('BTC', this.config.fallbackPrices.BTC);
    }
  }

  // Primary ETH price source - CoinGecko with multiple CORS proxies
  private async fetchETHPriceFromPrimarySource(): Promise<CryptoPrice> {
    const targetUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true';
    
    // Try multiple CORS proxies in order of reliability
    const proxies = [
      {
        url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
        parser: (data: any) => JSON.parse(data.contents)
      },
      {
        url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
        parser: (data: any) => data
      },
      {
        url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
        parser: (data: any) => data
      }
    ];

    let lastError: Error | null = null;

    for (const proxy of proxies) {
      try {
        console.log(`🔄 Trying ETH price from ${proxy.url.split('/')[2]}...`);
        
        const response = await fetch(proxy.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) {
          throw new Error(`Proxy returned ${response.status}`);
        }

        const proxyData = await response.json();
        const data = proxy.parser(proxyData);
        const ethData = data.ethereum;

        if (!ethData || !ethData.usd) {
          throw new Error('Invalid ETH data structure');
        }

        const price: CryptoPrice = {
          current: ethData.usd,
          dailyChange: (ethData.usd * (ethData.usd_24h_change || 0)) / 100,
          dailyChangePercent: ethData.usd_24h_change || 0,
          timestamp: Date.now(),
          source: 'coingecko'
        };

        if (!PriceValidator.validateETHPrice(price)) {
          throw new Error('ETH price validation failed');
        }

        console.log(`✅ ETH price fetched via ${proxy.url.split('/')[2]}: $${price.current}`);
        return price;
      } catch (error) {
        console.warn(`⚠️ Proxy ${proxy.url.split('/')[2]} failed:`, error);
        lastError = error as Error;
        continue;
      }
    }

    throw lastError || new Error('All CORS proxies failed for ETH');
  }

  // Primary BTC price source - CoinGecko with multiple CORS proxies
  private async fetchBTCPriceFromPrimarySource(): Promise<CryptoPrice> {
    const targetUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true';
    
    // Try multiple CORS proxies in order of reliability
    const proxies = [
      {
        url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
        parser: (data: any) => JSON.parse(data.contents)
      },
      {
        url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
        parser: (data: any) => data
      },
      {
        url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
        parser: (data: any) => data
      }
    ];

    let lastError: Error | null = null;

    for (const proxy of proxies) {
      try {
        console.log(`🔄 Trying BTC price from ${proxy.url.split('/')[2]}...`);
        
        const response = await fetch(proxy.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) {
          throw new Error(`Proxy returned ${response.status}`);
        }

        const proxyData = await response.json();
        const data = proxy.parser(proxyData);
        const btcData = data.bitcoin;

        if (!btcData || !btcData.usd) {
          throw new Error('Invalid BTC data structure');
        }

        const price: CryptoPrice = {
          current: btcData.usd,
          dailyChange: (btcData.usd * (btcData.usd_24h_change || 0)) / 100,
          dailyChangePercent: btcData.usd_24h_change || 0,
          timestamp: Date.now(),
          source: 'coingecko'
        };

        if (!PriceValidator.validateBTCPrice(price)) {
          throw new Error('BTC price validation failed');
        }

        console.log(`✅ BTC price fetched via ${proxy.url.split('/')[2]}: $${price.current}`);
        return price;
      } catch (error) {
        console.warn(`⚠️ Proxy ${proxy.url.split('/')[2]} failed:`, error);
        lastError = error as Error;
        continue;
      }
    }

    throw lastError || new Error('All CORS proxies failed for BTC');
  }

  // Fallback ETH price source - Yahoo Finance
  private async fetchETHPriceFromFallback(): Promise<CryptoPrice> {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/ETH-USD?interval=1m&range=1d';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Vaulto-Dashboard/1.0'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance ETH API failed: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    const meta = result?.meta;
    const quote = result?.indicators?.quote?.[0];

    if (!meta || !quote) {
      throw new Error('Invalid ETH data from Yahoo Finance');
    }

    const currentPrice = meta.regularMarketPrice || quote.close?.[quote.close.length - 1];
    const previousPrice = quote.close?.[0];
    
    if (!currentPrice || !previousPrice) {
      throw new Error('Missing price data from Yahoo Finance');
    }

    const dailyChangePercent = ((currentPrice - previousPrice) / previousPrice) * 100;

    const price: CryptoPrice = {
      current: currentPrice,
      dailyChange: currentPrice - previousPrice,
      dailyChangePercent,
      timestamp: Date.now(),
      source: 'yahoo'
    };

    if (!PriceValidator.validateETHPrice(price)) {
      throw new Error('ETH price validation failed');
    }

    return price;
  }

  // Fallback BTC price source - Yahoo Finance
  private async fetchBTCPriceFromFallback(): Promise<CryptoPrice> {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD?interval=1m&range=1d';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Vaulto-Dashboard/1.0'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance BTC API failed: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    const meta = result?.meta;
    const quote = result?.indicators?.quote?.[0];

    if (!meta || !quote) {
      throw new Error('Invalid BTC data from Yahoo Finance');
    }

    const currentPrice = meta.regularMarketPrice || quote.close?.[quote.close.length - 1];
    const previousPrice = quote.close?.[0];
    
    if (!currentPrice || !previousPrice) {
      throw new Error('Missing price data from Yahoo Finance');
    }

    const dailyChangePercent = ((currentPrice - previousPrice) / previousPrice) * 100;

    const price: CryptoPrice = {
      current: currentPrice,
      dailyChange: currentPrice - previousPrice,
      dailyChangePercent,
      timestamp: Date.now(),
      source: 'yahoo'
    };

    if (!PriceValidator.validateBTCPrice(price)) {
      throw new Error('BTC price validation failed');
    }

    return price;
  }

  // Get ETH price with caching and fallback
  async getETHPrice(): Promise<CryptoPrice> {
    await this.initialize();

    // Check cache first
    const cached = this.cache.get('ETH');
    if (cached) {
      console.log('📦 Using cached ETH price');
      return cached;
    }

    // Try primary source
    try {
      console.log('🔄 Fetching fresh ETH price from primary source...');
      const price = await retry(
        () => this.fetchETHPriceFromPrimarySource(),
        this.config.retryAttempts,
        this.config.retryDelay
      );
      
      this.cache.set('ETH', price);
      console.log('✅ ETH price fetched successfully:', price);
      return price;
    } catch (error) {
      console.warn('⚠️ Primary ETH source failed, trying fallback:', error);
      
      try {
        const price = await this.fetchETHPriceFromFallback();
        this.cache.set('ETH', price);
        console.log('✅ ETH price fetched from fallback:', price);
        return price;
      } catch (fallbackError) {
        console.error('❌ All ETH sources failed:', fallbackError);
        
        // Try to use cached price even if expired as a better fallback than hardcoded
        const cachedPrice = this.cache.getEvenIfExpired('ETH');
        if (cachedPrice && cachedPrice.source !== 'fallback') {
          console.log('⚠️ Using expired cached ETH price as fallback');
          return cachedPrice;
        }
        
        // Use hardcoded fallback as absolute last resort
        console.log('⚠️ Using hardcoded ETH fallback price');
        const fallback = { ...this.config.fallbackPrices.ETH, timestamp: Date.now() };
        this.cache.set('ETH', fallback);
        return fallback;
      }
    }
  }

  // Get BTC price with caching and fallback
  async getBTCPrice(): Promise<CryptoPrice> {
    await this.initialize();

    // Check cache first
    const cached = this.cache.get('BTC');
    if (cached) {
      console.log('📦 Using cached BTC price');
      return cached;
    }

    // Try primary source
    try {
      console.log('🔄 Fetching fresh BTC price from primary source...');
      const price = await retry(
        () => this.fetchBTCPriceFromPrimarySource(),
        this.config.retryAttempts,
        this.config.retryDelay
      );
      
      this.cache.set('BTC', price);
      console.log('✅ BTC price fetched successfully:', price);
      return price;
    } catch (error) {
      console.warn('⚠️ Primary BTC source failed, trying fallback:', error);
      
      try {
        const price = await this.fetchBTCPriceFromFallback();
        this.cache.set('BTC', price);
        console.log('✅ BTC price fetched from fallback:', price);
        return price;
      } catch (fallbackError) {
        console.error('❌ All BTC sources failed:', fallbackError);
        
        // Try to use cached price even if expired as a better fallback than hardcoded
        const cachedPrice = this.cache.getEvenIfExpired('BTC');
        if (cachedPrice && cachedPrice.source !== 'fallback') {
          console.log('⚠️ Using expired cached BTC price as fallback');
          return cachedPrice;
        }
        
        // Use hardcoded fallback as absolute last resort
        console.log('⚠️ Using hardcoded BTC fallback price');
        const fallback = { ...this.config.fallbackPrices.BTC, timestamp: Date.now() };
        this.cache.set('BTC', fallback);
        return fallback;
      }
    }
  }

  // Get both prices efficiently
  async getCryptoPrices(): Promise<{ eth: CryptoPrice; btc: CryptoPrice }> {
    await this.initialize();

    // Check if both are cached
    const cachedETH = this.cache.get('ETH');
    const cachedBTC = this.cache.get('BTC');

    if (cachedETH && cachedBTC) {
      console.log('📦 Using cached crypto prices');
      return { eth: cachedETH, btc: cachedBTC };
    }

    // Fetch both prices in parallel
    console.log('🔄 Fetching fresh crypto prices...');
    const [ethPrice, btcPrice] = await Promise.all([
      this.getETHPrice(),
      this.getBTCPrice()
    ]);

    console.log('✅ Crypto prices fetched successfully');
    return { eth: ethPrice, btc: btcPrice };
  }

  // Force refresh prices (bypass cache)
  async forceRefreshPrices(): Promise<{ eth: CryptoPrice; btc: CryptoPrice }> {
    console.log('🔄 Force refreshing crypto prices...');
    this.cache.clear();
    this.isInitialized = false;
    this.initializationPromise = null;
    return this.getCryptoPrices();
  }

  // Convert to legacy ETHPriceData format for compatibility
  async getETHPriceData(): Promise<ETHPriceData> {
    const price = await this.getETHPrice();
    return {
      current: price.current,
      dailyChange: price.dailyChange,
      dailyChangePercent: price.dailyChangePercent,
      timestamp: price.timestamp
    };
  }

  // Get cache status for debugging
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size(),
      keys: Array.from(this.cache['cache'].keys())
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const priceService = new PriceService();

// Export legacy-compatible functions
export const getETHPrice = () => priceService.getETHPriceData();
export const getBTCPrice = () => priceService.getBTCPrice();
export const getCryptoPrices = () => priceService.getCryptoPrices();
export const forceRefreshPrices = () => priceService.forceRefreshPrices();
