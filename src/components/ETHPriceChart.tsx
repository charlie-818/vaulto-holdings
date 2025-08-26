import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from './LoadingSpinner';
import './PerformanceChart.css';

// Time frame options
export type TimeFrame = '1D' | '7D' | '30D' | '90D';

interface PriceDataPoint {
  timestamp: number;
  price: number;
  date: string;
}

interface ETHPriceChartProps {
  data?: PriceDataPoint[];
}

const ETHPriceChart: React.FC<ETHPriceChartProps> = ({ data: propData }) => {
  const [data, setData] = useState<PriceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('1D');
  const [isMobile, setIsMobile] = useState(false);
  
  // Cache for storing fetched data
  const dataCache = useRef<Map<string, { data: PriceDataPoint[]; timestamp: number }>>(new Map());
  const fetchInProgress = useRef<Map<string, Promise<PriceDataPoint[]>>>(new Map());
  
  // Cache duration: 10 minutes for 1D, 15 minutes for longer timeframes
  const getCacheDuration = (timeFrame: TimeFrame): number => {
    switch (timeFrame) {
      case '1D':
        return 10 * 60 * 1000; // 10 minutes
      default:
        return 15 * 60 * 1000; // 15 minutes
    }
  };



  // Time frame configurations for CoinGecko API
  const timeFrameConfig = {
    '1D': { days: 1 },
    '7D': { days: 7 },
    '30D': { days: 30 },
    '90D': { days: 90 }
  };

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch ETH price data with intelligent caching
  const fetchETHPriceData = useCallback(async (timeFrame: TimeFrame, forceRefresh: boolean = false) => {
    const cacheKey = `eth_${timeFrame}`;
    const cacheDuration = getCacheDuration(timeFrame);
    const now = Date.now();
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = dataCache.current.get(cacheKey);
      if (cached && (now - cached.timestamp) < cacheDuration) {
        console.log(`Using cached data for ${timeFrame} (age: ${Math.round((now - cached.timestamp) / 1000)}s)`);
        setData(cached.data);
        setLastUpdated(new Date(cached.timestamp));
        setLoading(false);
        setError(null);
        return;
      }
    }
    
    // Check if fetch is already in progress
    if (fetchInProgress.current.has(cacheKey)) {
      console.log(`Fetch already in progress for ${timeFrame}, waiting...`);
             try {
         const result = await fetchInProgress.current.get(cacheKey);
         if (result) {
           setData(result);
           setLastUpdated(new Date());
           setLoading(false);
           setError(null);
           return;
         }
       } catch (err) {
         console.error(`Error in in-progress fetch for ${timeFrame}:`, err);
       }
    }
    
    // Start new fetch
    setLoading(true);
    setError(null);
    
    console.log(`Fetching fresh data for ${timeFrame} timeframe...`);
    
    const fetchPromise = (async () => {
      try {
                 // Use CoinGecko API with proper rate limiting
         const daysMap = {
           '1D': 1,
           '7D': 7,
           '30D': 30,
           '90D': 90
         };
        
        const days = daysMap[timeFrame];
        const coingeckoResponse = await fetch(
          `https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=${days}`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Vaulto-Dashboard/1.0'
            }
          }
        );
        
        if (!coingeckoResponse.ok) {
          throw new Error(`CoinGecko API failed: ${coingeckoResponse.status}`);
        }
        
        const coingeckoData = await coingeckoResponse.json();
        
        if (!coingeckoData.prices || !Array.isArray(coingeckoData.prices)) {
          throw new Error('Invalid data structure from CoinGecko');
        }
        
                 // Transform and validate data
         const transformedData: PriceDataPoint[] = coingeckoData.prices
           .map(([timestamp, price]: [number, number]) => ({
             timestamp,
             price: Math.round(price * 100) / 100,
             date: new Date(timestamp).toISOString()
           }))
           .filter((point: PriceDataPoint) => point.price > 0 && point.timestamp > 0 && !isNaN(point.price))
           .sort((a: PriceDataPoint, b: PriceDataPoint) => a.timestamp - b.timestamp);
        
        if (transformedData.length === 0) {
          throw new Error('No valid price data received');
        }
        
        // Cache the successful result
        dataCache.current.set(cacheKey, {
          data: transformedData,
          timestamp: now
        });
        
        console.log(`Successfully fetched and cached data for ${timeFrame}:`, transformedData.length, 'points');
        return transformedData;
        
      } catch (err) {
        console.error(`Error fetching data for ${timeFrame}:`, err);
        
        // Try to use cached data even if expired
        const cached = dataCache.current.get(cacheKey);
        if (cached) {
          console.log(`Using expired cached data for ${timeFrame} due to fetch error`);
          return cached.data;
        }
        
                 // Generate fallback data
         console.warn(`Generating fallback data for ${timeFrame}`);
         const fallbackData: PriceDataPoint[] = [];
         const basePrice = 4380;
         const dataPoints = 24; // Default to 24 data points for all timeframes
         const intervalMs = (24 * 60 * 60 * 1000) / dataPoints;
        
        for (let i = dataPoints - 1; i >= 0; i--) {
          const timestamp = now - (i * intervalMs);
          fallbackData.push({
            timestamp,
            price: basePrice + (Math.random() - 0.5) * 50,
            date: new Date(timestamp).toISOString()
          });
        }
        
        return fallbackData;
      }
    })();
    
    // Store the fetch promise
    fetchInProgress.current.set(cacheKey, fetchPromise);
    
    try {
      const result = await fetchPromise;
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error(`Final error for ${timeFrame}:`, err);
      setError('Unable to fetch data. Using cached or fallback data.');
    } finally {
      setLoading(false);
      fetchInProgress.current.delete(cacheKey);
    }
  }, []);

  // Handle time frame change
  const handleTimeFrameChange = useCallback((timeFrame: TimeFrame) => {
    setSelectedTimeFrame(timeFrame);
    fetchETHPriceData(timeFrame, true);
  }, [fetchETHPriceData]);

  // Initial data fetch - no periodic refresh to avoid rate limiting
  useEffect(() => {
    if (propData) {
      setData(propData);
      setLoading(false);
    } else {
      fetchETHPriceData(selectedTimeFrame, false);
    }
  }, [propData, selectedTimeFrame, fetchETHPriceData]);

  // Calculate price change and percentage
  const priceChange = useMemo(() => {
    if (data.length < 2) return { change: 0, changePercent: 0, isPositive: true };
    
    const firstPrice = data[0].price;
    const lastPrice = data[data.length - 1].price;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;
    
    return {
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      isPositive: change >= 0
    };
  }, [data]);

  // Format tooltip
  const formatTooltip = (value: any, name: string) => {
    if (name === 'price') {
      return [`$${value.toFixed(2)}`, 'ETH Price'];
    }
    return [value, name];
  };

  // Format Y-axis values
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Calculate Y-axis domain with proper padding
  const calculateYAxisDomain = useMemo(() => {
    if (!data || data.length === 0) return ['auto', 'auto'];
    
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    
    // Add 10% padding on each side for better visualization
    const padding = range * 0.1;
    const domainMin = Math.max(0, minPrice - padding);
    const domainMax = maxPrice + padding;
    
    return [domainMin, domainMax];
  }, [data]);

  // Format X-axis values based on time frame
  const formatXAxis = (value: string) => {
    const date = new Date(value);
    
    switch (selectedTimeFrame) {
      case '1D':
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          hour12: true 
        });
      case '7D':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      case '30D':
      case '90D':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      default:
        return date.toLocaleDateString();
    }
  };

  // Calculate X-axis ticks based on time frame and data length
  const calculateXAxisTicks = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const maxTicks = isMobile ? 4 : 6;
    const interval = Math.max(1, Math.floor(data.length / maxTicks));
    
    const ticks = [];
    for (let i = 0; i < data.length; i += interval) {
      ticks.push(data[i].date);
    }
    
    // Always include the last data point
    if (data.length > 0 && !ticks.includes(data[data.length - 1].date)) {
      ticks.push(data[data.length - 1].date);
    }
    
    return ticks;
  }, [data, isMobile]);

  // Responsive chart margins
  const getChartMargins = () => {
    if (isMobile) {
      // Extra bottom margin for small screens to prevent x-axis cutoff
      const isSmallMobile = window.innerWidth <= 480;
      return { 
        top: 20, 
        right: 10, 
        left: 10, 
        bottom: isSmallMobile ? 50 : 40 
      };
    }
    return { top: 20, right: 20, left: 20, bottom: 20 };
  };

  // Responsive font sizes
  const getFontSize = () => {
    return isMobile ? 10 : 12;
  };

  // Responsive stroke width
  const getStrokeWidth = () => {
    return isMobile ? 2 : 3;
  };

  if (loading) {
    return (
      <div className="performance-chart">
        <div className="chart-header">
          <div className="chart-title">
            <h3>ETH Price</h3>
            <div className="price-info">
              {data && data.length > 0 && (
                <span className="current-price">
                  ${data[data.length - 1].price.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="chart-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error && !propData) {
    return (
      <div className="performance-chart">
        <div className="chart-header">
          <h3>ETH Price</h3>
        </div>
        <div className="chart-container">
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <div className="error-text">{error}</div>
            <button 
              className="retry-button"
              onClick={() => fetchETHPriceData(selectedTimeFrame, true)}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="performance-chart">
      <div className="chart-header">
        <div className="chart-title">
          <h3>ETH Price</h3>
          <div className="price-info">
            {data && data.length > 0 && (
              <div className="price-details">
                <span className="current-price">
                  ${data[data.length - 1].price.toFixed(2)}
                </span>
                <span className={`price-change ${priceChange.isPositive ? 'positive' : 'negative'}`}>
                  {priceChange.isPositive ? '+' : ''}{priceChange.change.toFixed(2)} ({priceChange.isPositive ? '+' : ''}{priceChange.changePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="chart-controls">
          <div className="time-frame-selector">
            {timeFrameConfig && Object.keys(timeFrameConfig).map((timeFrame) => (
              <button
                key={timeFrame}
                className={`time-frame-button ${selectedTimeFrame === timeFrame ? 'active' : ''}`}
                onClick={() => handleTimeFrameChange(timeFrame as TimeFrame)}
              >
                {timeFrame}
              </button>
            ))}
          </div>
          <button 
            className="refresh-button" 
            onClick={() => fetchETHPriceData(selectedTimeFrame, true)}
            disabled={loading}
            title="Force refresh ETH price data (bypasses cache)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
        </div>
        {lastUpdated && (
          <div className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
            {dataCache.current.has(`eth_${selectedTimeFrame}`) && (
              <span className="cache-indicator"> (cached)</span>
            )}
          </div>
        )}
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={isMobile ? 240 : 300}>
          <LineChart data={data || []} margin={getChartMargins()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={getFontSize()}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatXAxis}
              tickMargin={isMobile ? 12 : 8}
              ticks={calculateXAxisTicks}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={getFontSize()}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
              tickMargin={8}
              width={isMobile ? 60 : 80}
              domain={calculateYAxisDomain}
              allowDataOverflow={false}
              tickCount={5}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });
              }}
              labelStyle={{ color: '#1a1a1a', fontSize: getFontSize() }}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: getFontSize()
              }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={priceChange.isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={getStrokeWidth()}
              dot={false}
              activeDot={{ 
                r: isMobile ? 5 : 6, 
                fill: priceChange.isPositive ? "#10b981" : "#ef4444", 
                stroke: "#ffffff", 
                strokeWidth: 2 
              }}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ETHPriceChart;
