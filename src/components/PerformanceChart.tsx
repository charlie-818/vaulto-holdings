import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { marketAPI } from '../services/api';
import './PerformanceChart.css';

interface PerformanceData {
  date: string;
  price: number;
}

interface PerformanceChartProps {
  data?: PerformanceData[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data: propData }) => {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchETHData = async () => {
      try {
        setLoading(true);
        const ethData = await marketAPI.getETHHistoricalData(365); // Last 365 days
        setData(ethData);
        setError(null);
      } catch (err) {
        console.error('Error fetching ETH data:', err);
        setError('Failed to load Ethereum price data');
        // Fallback to prop data if available
        if (propData) {
          setData(propData);
        }
      } finally {
        setLoading(false);
      }
    };

    if (propData) {
      setData(propData);
      setLoading(false);
    } else {
      fetchETHData();
    }
  }, [propData]);

  const formatTooltip = (value: any, name: string) => {
    if (name === 'price') {
      return [`$${value.toLocaleString()}`, 'ETH Price'];
    }
    return [value, name];
  };

  const formatYAxis = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="performance-chart">
        <div className="chart-header">
          <h3>Ethereum Price Performance</h3>
        </div>
        <div className="chart-container">
          <div className="loading">Loading Ethereum price data...</div>
        </div>
      </div>
    );
  }

  if (error && !propData) {
    return (
      <div className="performance-chart">
        <div className="chart-header">
          <h3>Ethereum Price Performance</h3>
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
        <h3>Ethereum Price Performance</h3>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              ticks={(() => {
                const monthTicks: string[] = [];
                const seenMonths = new Set<string>();
                
                data.forEach((item, index) => {
                  const date = new Date(item.date);
                  const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
                  
                  if (!seenMonths.has(monthKey)) {
                    seenMonths.add(monthKey);
                    monthTicks.push(item.date);
                  }
                });
                
                return monthTicks;
              })()}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short' });
              }}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
              }}
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
              dataKey="price" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;
