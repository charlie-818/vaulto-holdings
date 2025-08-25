import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { marketAPI } from '../services/api';
import './PerformanceChart.css';

interface HourlyPnLData {
  hour: string;
  pnl: number;
}

interface PerformanceChartProps {
  data?: HourlyPnLData[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data: propData }) => {
  const [data, setData] = useState<HourlyPnLData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHourlyPnLData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      
      // If forcing refresh, invalidate cache first
      if (forceRefresh) {
        console.log('Force refreshing PnL data...');
        // Clear any cached data by making a fresh request
      }
      
      const hourlyData = await marketAPI.generateHourlyPnLData();
      setData(hourlyData);
      setError(null);
      setLastUpdated(new Date());
      
      console.log('PnL data updated successfully:', hourlyData.length, 'data points');
    } catch (err) {
      console.error('Error fetching hourly PnL data:', err);
      setError('Failed to load hourly PnL data');
      if (propData) {
        setData(propData);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propData) {
      setData(propData);
      setLoading(false);
    } else {
      fetchHourlyPnLData(false);
    }

    // Set up periodic refresh for real-time updates
    const interval = setInterval(() => fetchHourlyPnLData(false), 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [propData]);

  const formatTooltip = (value: any, name: string) => {
    if (name === 'pnl') {
      return [`$${value.toLocaleString()}`, 'PnL'];
    }
    return [value, name];
  };

  const formatYAxis = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  const formatXAxis = (value: string) => {
    // Format time display (e.g., "14:30" -> "2:30 PM")
    const [hour, minute] = value.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="performance-chart">
        <div className="chart-header">
          <h3>Total PnL</h3>
        </div>
        <div className="chart-container">
          <div className="loading">Loading PnL data...</div>
        </div>
      </div>
    );
  }

  if (error && !propData) {
    return (
      <div className="performance-chart">
        <div className="chart-header">
          <h3>Total PnL</h3>
        </div>
        <div className="chart-container">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="performance-chart">
      <div className="chart-header">
        <div className="chart-title">
          <h3>Total PnL</h3>
          {lastUpdated && (
            <div className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        <button 
          className="refresh-button" 
          onClick={() => fetchHourlyPnLData(true)}
          disabled={loading}
          title="Refresh PnL data"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 40, left: 40, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="hour" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatXAxis}
              tickMargin={10}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
              tickMargin={10}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={(label) => `Time: ${formatXAxis(label)}`}
              labelStyle={{ color: '#1a1a1a' }}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="pnl" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: "#10b981" }}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;
