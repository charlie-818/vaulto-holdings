/**
 * Simple, non-blocking price service
 * No complex initialization, no blocking, no retries
 * Just simple fetch with immediate fallback
 */

export interface SimplePrice {
  current: number;
  dailyChangePercent: number;
}

// Simple fallback prices - used immediately if fetch fails
const FALLBACK_PRICES = {
  ETH: { current: 2450, dailyChangePercent: 0 },
  BTC: { current: 62000, dailyChangePercent: 0 }
};

// Simple in-memory cache (30 seconds)
let ethCache: { price: SimplePrice; expiry: number } | null = null;
let btcCache: { price: SimplePrice; expiry: number } | null = null;

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
    
    return price;
  } catch (error) {
    console.log('ETH price fetch failed, using fallback:', error);
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
    
    return price;
  } catch (error) {
    console.log('BTC price fetch failed, using fallback:', error);
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

