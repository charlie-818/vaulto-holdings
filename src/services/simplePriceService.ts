/**
 * Simple, non-blocking price service
 * No complex initialization, no blocking, no retries
 * Just simple fetch with immediate fallback
 */

export interface SimplePrice {
  current: number;
  dailyChangePercent: number;
}

// localStorage key for persisting last known good prices
const LAST_KNOWN_PRICES_KEY = 'vaulto_last_known_prices';

// Simple fallback prices - used only if localStorage is empty and fetch fails
const FALLBACK_PRICES = {
  ETH: { current: 3000, dailyChangePercent: 0 },
  BTC: { current: 80000, dailyChangePercent: 0 }
};

// Simple in-memory cache (30 seconds)
let ethCache: { price: SimplePrice; expiry: number } | null = null;
let btcCache: { price: SimplePrice; expiry: number } | null = null;

/**
 * Save last known good prices to localStorage
 */
function saveLastKnownPrices(eth?: SimplePrice, btc?: SimplePrice): void {
  try {
    const stored = loadLastKnownPrices();
    const updated = {
      eth: eth || stored.eth,
      btc: btc || stored.btc,
      timestamp: Date.now()
    };
    localStorage.setItem(LAST_KNOWN_PRICES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save last known prices:', error);
  }
}

/**
 * Load last known good prices from localStorage
 */
function loadLastKnownPrices(): { eth: SimplePrice | null; btc: SimplePrice | null; timestamp: number } {
  try {
    const stored = localStorage.getItem(LAST_KNOWN_PRICES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Use cached prices if less than 24 hours old
      if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return {
          eth: parsed.eth || null,
          btc: parsed.btc || null,
          timestamp: parsed.timestamp
        };
      }
    }
  } catch (error) {
    console.warn('Failed to load last known prices:', error);
  }
  return { eth: null, btc: null, timestamp: 0 };
}

/**
 * Fetch ETH price - simple, non-blocking
 * Returns fallback immediately if any issues
 */
export async function getETHPrice(): Promise<SimplePrice> {
  // Check cache first
  if (ethCache && Date.now() < ethCache.expiry) {
    return ethCache.price;
  }

  try {
    // Simple fetch with 5 second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true',
      { signal: controller.signal }
    );
    
    clearTimeout(timeout);

    if (!response.ok) throw new Error('API error');

    const data = await response.json();
    const ethData = data.ethereum;

    if (!ethData || !ethData.usd) throw new Error('Invalid data');

    const price: SimplePrice = {
      current: ethData.usd,
      dailyChangePercent: ethData.usd_24h_change || 0
    };

    // Cache for 30 seconds
    ethCache = { price, expiry: Date.now() + 30000 };
    
    // Save to localStorage for persistence
    saveLastKnownPrices(price, undefined);
    
    return price;
  } catch (error) {
    console.log('ETH price fetch failed, trying fallbacks:', error);
    
    // Try localStorage first
    const lastKnown = loadLastKnownPrices();
    if (lastKnown.eth) {
      console.log('Using last known ETH price from localStorage');
      return lastKnown.eth;
    }
    
    // Use hardcoded fallback as last resort
    console.log('Using hardcoded ETH fallback price');
    return FALLBACK_PRICES.ETH;
  }
}

/**
 * Fetch BTC price - simple, non-blocking
 * Returns fallback immediately if any issues
 */
export async function getBTCPrice(): Promise<SimplePrice> {
  // Check cache first
  if (btcCache && Date.now() < btcCache.expiry) {
    return btcCache.price;
  }

  try {
    // Simple fetch with 5 second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
      { signal: controller.signal }
    );
    
    clearTimeout(timeout);

    if (!response.ok) throw new Error('API error');

    const data = await response.json();
    const btcData = data.bitcoin;

    if (!btcData || !btcData.usd) throw new Error('Invalid data');

    const price: SimplePrice = {
      current: btcData.usd,
      dailyChangePercent: btcData.usd_24h_change || 0
    };

    // Cache for 30 seconds
    btcCache = { price, expiry: Date.now() + 30000 };
    
    // Save to localStorage for persistence
    saveLastKnownPrices(undefined, price);
    
    return price;
  } catch (error) {
    console.log('BTC price fetch failed, trying fallbacks:', error);
    
    // Try localStorage first
    const lastKnown = loadLastKnownPrices();
    if (lastKnown.btc) {
      console.log('Using last known BTC price from localStorage');
      return lastKnown.btc;
    }
    
    // Use hardcoded fallback as last resort
    console.log('Using hardcoded BTC fallback price');
    return FALLBACK_PRICES.BTC;
  }
}

/**
 * Get both prices in parallel
 */
export async function getBothPrices(): Promise<{ eth: SimplePrice; btc: SimplePrice }> {
  const [eth, btc] = await Promise.all([
    getETHPrice(),
    getBTCPrice()
  ]);
  
  return { eth, btc };
}

