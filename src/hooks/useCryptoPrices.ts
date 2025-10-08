import { useState, useEffect, useCallback, useRef } from 'react';
import { priceService, CryptoPrice } from '../services/priceService';

interface UseCryptoPricesReturn {
  ethPrice: CryptoPrice | null;
  btcPrice: CryptoPrice | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refreshPrices: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

interface UseCryptoPricesOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableErrorRetry?: boolean;
  onError?: (error: string) => void;
}

export const useCryptoPrices = (options: UseCryptoPricesOptions = {}): UseCryptoPricesReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enableErrorRetry = true,
    onError
  } = options;

  const [ethPrice, setEthPrice] = useState<CryptoPrice | null>(null);
  const [btcPrice, setBtcPrice] = useState<CryptoPrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);

  // Fetch prices function
  const fetchPrices = useCallback(async (isRetry = false) => {
    if (!isRetry) {
      setIsLoading(true);
      setError(null);
    }

    try {
      console.log('🔄 Fetching crypto prices...');
      const prices = await priceService.getCryptoPrices();
      
      setEthPrice(prices.eth);
      setBtcPrice(prices.btc);
      setLastUpdated(Date.now());
      setError(null);
      
      console.log('✅ Crypto prices updated:', {
        ETH: `$${prices.eth.current} (${prices.eth.dailyChangePercent > 0 ? '+' : ''}${prices.eth.dailyChangePercent.toFixed(2)}%)`,
        BTC: `$${prices.btc.current} (${prices.btc.dailyChangePercent > 0 ? '+' : ''}${prices.btc.dailyChangePercent.toFixed(2)}%)`,
        source: prices.eth.source
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prices';
      console.error('❌ Failed to fetch crypto prices:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);

      // Retry on error if enabled
      if (enableErrorRetry && !isRetry) {
        console.log('🔄 Retrying price fetch in 5 seconds...');
        retryTimeoutRef.current = setTimeout(() => {
          fetchPrices(true);
        }, 5000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [enableErrorRetry, onError]);

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Force refreshing crypto prices...');
      const prices = await priceService.forceRefreshPrices();
      
      setEthPrice(prices.eth);
      setBtcPrice(prices.btc);
      setLastUpdated(Date.now());
      setError(null);
      
      console.log('✅ Crypto prices force refreshed:', {
        ETH: `$${prices.eth.current} (${prices.eth.dailyChangePercent > 0 ? '+' : ''}${prices.eth.dailyChangePercent.toFixed(2)}%)`,
        BTC: `$${prices.btc.current} (${prices.btc.dailyChangePercent > 0 ? '+' : ''}${prices.btc.dailyChangePercent.toFixed(2)}%)`,
        source: prices.eth.source
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to force refresh prices';
      console.error('❌ Failed to force refresh crypto prices:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Initialize prices on mount
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      fetchPrices();
    }
  }, [fetchPrices]);

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchPrices();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchPrices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ethPrice,
    btcPrice,
    isLoading,
    error,
    lastUpdated,
    refreshPrices: fetchPrices,
    forceRefresh
  };
};

// Hook for just ETH price (for backward compatibility)
export const useETHPrice = () => {
  const [ethPrice, setEthPrice] = useState<CryptoPrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchETHPrice = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const price = await priceService.getETHPrice();
        setEthPrice(price);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ETH price';
        setError(errorMessage);
        console.error('❌ Failed to fetch ETH price:', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchETHPrice();
  }, []);

  return { ethPrice, isLoading, error };
};

// Hook for just BTC price
export const useBTCPrice = () => {
  const [btcPrice, setBtcPrice] = useState<CryptoPrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBTCPrice = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const price = await priceService.getBTCPrice();
        setBtcPrice(price);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch BTC price';
        setError(errorMessage);
        console.error('❌ Failed to fetch BTC price:', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBTCPrice();
  }, []);

  return { btcPrice, isLoading, error };
};
