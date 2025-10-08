/**
 * Simple React hook for crypto prices
 * Non-blocking, loads prices in background
 */

import { useState, useEffect } from 'react';
import { SimplePrice, getBothPrices } from '../services/simplePriceService';

interface UsePricesReturn {
  ethPrice: SimplePrice | null;
  btcPrice: SimplePrice | null;
  isLoading: boolean;
}

export function useSimplePrices(): UsePricesReturn {
  const [ethPrice, setEthPrice] = useState<SimplePrice | null>(null);
  const [btcPrice, setBtcPrice] = useState<SimplePrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchPrices = async () => {
      try {
        const prices = await getBothPrices();
        if (mounted) {
          setEthPrice(prices.eth);
          setBtcPrice(prices.btc);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Price fetch error:', error);
        // Set fallback prices
        if (mounted) {
          setEthPrice({ current: 2450, dailyChangePercent: 0 });
          setBtcPrice({ current: 62000, dailyChangePercent: 0 });
          setIsLoading(false);
        }
      }
    };

    fetchPrices();

    // Refresh every 60 seconds
    const interval = setInterval(fetchPrices, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { ethPrice, btcPrice, isLoading };
}

