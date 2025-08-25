import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from './LoadingSpinner';
import './PerformanceChart.css'; // Reuse the same CSS for consistency

interface HourlyETHPriceData {
  hour: string;
  price: number;
}

interface ETHPriceChartProps {
  data?: HourlyETHPriceData[];
}

const ETHPriceChart: React.FC<ETHPriceChartProps> = ({ data: propData }) => {
  const [data, setData] = useState<HourlyETHPriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchETHPriceData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      
      // Import the marketAPI dynamically to avoid circular dependencies
      const { marketAPI } = await import('../services/api');
      
      // If forcing refresh, invalidate cache first
      if (forceRefresh) {
        console.log('Force refreshing ETH price data...');
        // Clear any cached data by making a fresh request
      }
      
      const hourlyData = await marketAPI.generateETHPriceData();
      setData(hourlyData);
      setError(null);
      setLastUpdated(new Date());
      
      console.log('ETH price data updated successfully:', hourlyData.length, 'data points');
    } catch (err) {
      console.error('Error fetching hourly ETH price data:', err);
      setError('Failed to load hourly ETH price data');
      if (propData) {
        setData(propData);
      }
    } finally {
      setLoading(false);
    }
  }, [propData]);

  useEffect(() => {
    if (propData) {
      setData(propData);
      setLoading(false);
    } else {
      fetchETHPriceData(false);
    }

    // Set up periodic refresh for real-time updates
    const interval = setInterval(() => fetchETHPriceData(false), 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [propData, fetchETHPriceData]);

  const formatTooltip = (value: any, name: string) => {
    if (name === 'price') {
      return [`$${value.toFixed(2)}`, 'ETH Price'];
    }
    return [value, name];
  };

  const formatYAxis = (value: number) => {
    // Format with K for thousands to make it cleaner
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${Math.round(value)}`;
  };

  // Calculate consistent Y-axis domain with evenly spaced values
  const calculateYAxisDomain = (data: HourlyETHPriceData[]) => {
    if (!data || data.length === 0) return ['auto', 'auto'];
    
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    
    // Add 10% padding on each side for better visualization
    const padding = range * 0.1;
    let domainMin = Math.floor(minPrice - padding);
    let domainMax = Math.ceil(maxPrice + padding);
    
    // Ensure the range is divisible by 4 for 5 evenly spaced ticks
    const totalRange = domainMax - domainMin;
    const step = Math.ceil(totalRange / 4);
    
    // Adjust domain to have clean steps
    domainMin = Math.floor(domainMin / step) * step;
    domainMax = domainMin + (step * 4);
    
    return [domainMin, domainMax];
  };

  const formatXAxis = (value: string) => {
    // Parse the time value (e.g., "14:00", "15:30")
    const [hour, minute] = value.split(':').map(Number);
    
    // Convert to 12-hour format with consistent formatting
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    
    // Return formatted time (e.g., "2:00 PM", "3:30 PM")
    return `${displayHour}:${displayMinute} ${ampm}`;
  };

  // Responsive chart margins
  const getChartMargins = () => {
    if (isMobile) {
      return { top: 10, right: 15, left: 15, bottom: 10 };
    }
    return { top: 10, right: 20, left: 20, bottom: 10 };
  };

  // Responsive font sizes
  const getFontSize = () => {
    return isMobile ? 10 : 11;
  };

  // Responsive stroke width
  const getStrokeWidth = () => {
    return isMobile ? 2 : 2.5;
  };

  if (loading) {
    return (
      <div className="performance-chart">
        <div className="chart-header">
          <h3>ETH Price</h3>
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
          {lastUpdated && (
            <div className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        <button 
          className="refresh-button" 
          onClick={() => fetchETHPriceData(true)}
          disabled={loading}
          title="Refresh ETH price data"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={getChartMargins()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="hour" 
              stroke="#6b7280"
              fontSize={getFontSize()}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatXAxis}
              tickMargin={isMobile ? 6 : 8}
              interval={Math.max(1, Math.floor(data.length / 6))}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={getFontSize()}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
              tickMargin={isMobile ? 6 : 8}
              width={isMobile ? 50 : 60}
              domain={calculateYAxisDomain(data)}
              allowDataOverflow={false}
              tickCount={5}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={(label) => `Time: ${formatXAxis(label)}`}
              labelStyle={{ color: '#1a1a1a', fontSize: isMobile ? '11px' : '12px' }}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: isMobile ? '11px' : '12px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#3b82f6" 
              strokeWidth={getStrokeWidth()}
              dot={false}
              activeDot={{ r: isMobile ? 4 : 5, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2 }}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ETHPriceChart;
