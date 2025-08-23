import React, { useState, useEffect } from 'react';
import { VaultMetrics, PerformanceMetrics, VaultStatistics, DataSource, ETHPriceData } from '../types';
import { mockVaultMetrics, mockPerformanceMetrics, mockVaultStatistics, mockDataSources } from '../data/mockData';
import { marketAPI } from '../services/api';
import Header from './Header';
import MetricCard from './MetricCard';
import PerformanceChart from './PerformanceChart';
import Footer from './Footer';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [vaultMetrics, setVaultMetrics] = useState<VaultMetrics>(mockVaultMetrics);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>(mockPerformanceMetrics);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [vaultStatistics, setVaultStatistics] = useState<VaultStatistics>(mockVaultStatistics);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dataSources, setDataSources] = useState<DataSource[]>(mockDataSources);
  const [ethPriceData, setEthPriceData] = useState<ETHPriceData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real ETH price data
  const fetchETHPrice = async () => {
    try {
      const priceData = await marketAPI.getETHPrice();
      setEthPriceData(priceData);
      
      // Update vault metrics with real ETH price
      setVaultMetrics(prev => ({
        ...prev,
        ethPrice: {
          current: priceData.current,
          dailyChange: priceData.dailyChange,
          dailyChangePercent: priceData.dailyChangePercent
        },
        liquidationPrice: {
          ...prev.liquidationPrice,
          currentEthPrice: priceData.current,
          distance: priceData.current - prev.liquidationPrice.value,
          isDangerZone: (priceData.current - prev.liquidationPrice.value) < 100
        }
      }));
    } catch (error) {
      console.error('Error fetching ETH price:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchETHPrice();
      setLoading(false);
    };

    initializeData();
  }, []);

  // Real-time ETH price updates
  useEffect(() => {
    const interval = setInterval(fetchETHPrice, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <Header />
        <main className="main-content">
          <div className="container">
            <div className="loading-container">
              <div className="loading">Loading real-time data...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header />
      
      <main className="main-content">
        <div className="container">
          {/* Hero Section with ETH Price */}
          <section className="hero-section">
            <div className="hero-content">
              <div className="hero-price">
                <div className="price-label">ETH Price</div>
                <div className="price-value">${(ethPriceData?.current || vaultMetrics.ethPrice.current).toLocaleString()}</div>
                <div className="vault-address-mini">
                  <span className="address-text">0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6</span>
                  <button className="copy-button-mini" onClick={() => navigator.clipboard.writeText('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')} title="Copy address">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                  </button>
                </div>
                <div className={`price-change ${(ethPriceData?.dailyChangePercent || vaultMetrics.ethPrice.dailyChangePercent) >= 0 ? 'positive' : 'negative'}`}>
                  {(ethPriceData?.dailyChangePercent || vaultMetrics.ethPrice.dailyChangePercent) >= 0 ? '+' : ''}{(ethPriceData?.dailyChangePercent || vaultMetrics.ethPrice.dailyChangePercent).toFixed(2)}%
                </div>
              </div>
            </div>
          </section>

          {/* Primary Metrics Grid */}
          <section id="metrics" className="primary-metrics">
            <div className="metrics-grid">
              <MetricCard
                title="ETH Net Exposure"
                value={`${vaultMetrics.ethNetExposure.value}x ETH`}
                change={{
                  value: vaultMetrics.ethNetExposure.dailyChange,
                  percent: vaultMetrics.ethNetExposure.dailyChangePercent,
                  period: '24h'
                }}
                tooltip="Current leveraged exposure to Ethereum, including all positions and derivatives"
              />
              
              <MetricCard
                title="Liquidation Price"
                value={`$${vaultMetrics.liquidationPrice.value.toLocaleString()}`}
                subtitle={`${vaultMetrics.liquidationPrice.distance.toFixed(0)} points from current price`}
                isDanger={vaultMetrics.liquidationPrice.isDangerZone}
                tooltip="Price at which positions would be liquidated. Red indicates proximity to current ETH price."
              />
              
              <MetricCard
                title="Vault NAV"
                value={`$${vaultMetrics.vaultNav.usd.toLocaleString()}`}
                subtitle={`${vaultMetrics.vaultNav.eth.toFixed(2)} ETH`}
                tooltip="Net Asset Value of the vault in USD and ETH"
              />
              
              <MetricCard
                title="Total Vault Value"
                value={`$${vaultMetrics.totalVaultValue.usd.toLocaleString()}`}
                subtitle={`${vaultMetrics.totalVaultValue.eth.toFixed(2)} ETH`}
                tooltip="Total value of all assets under management"
              />
            </div>
          </section>

          {/* Performance Section */}
          <section id="performance" className="performance-section">
            <div className="performance-grid">
              <div className="performance-metrics">
                <div className="performance-cards">
                  <MetricCard
                    title="Total Return"
                    value={`${performanceMetrics.inception.returnPercent.toFixed(2)}%`}
                    subtitle={`$${performanceMetrics.inception.returnUsd.toLocaleString()}`}
                  />
                  <MetricCard
                    title="30-Day Return"
                    value={`${performanceMetrics.monthly.returnPercent.toFixed(2)}%`}
                    subtitle={`$${performanceMetrics.monthly.returnUsd.toLocaleString()}`}
                  />
                  <MetricCard
                    title="Daily Return"
                    value={`${performanceMetrics.daily.returnPercent.toFixed(2)}%`}
                    subtitle={`$${performanceMetrics.daily.returnUsd.toLocaleString()}`}
                  />
                </div>
              </div>
              
              <div className="performance-chart-wrapper">
                <PerformanceChart />
              </div>
            </div>
          </section>

          {/* Risk Management Section */}
          <section id="risk" className="risk-section">
            <div className="risk-metrics">
              <div className="risk-cards">
                <MetricCard
                  title="30-Day Volatility"
                  value={`${(vaultStatistics.volatility30d * 100).toFixed(2)}%`}
                />
                <MetricCard
                  title="1-Year Volatility"
                  value={`${(vaultStatistics.volatility1y * 100).toFixed(2)}%`}
                />
                <MetricCard
                  title="VaR (95%)"
                  value={`${(vaultStatistics.var95 * 100).toFixed(2)}%`}
                  tooltip="Value at Risk - 95% confidence interval"
                />
                <MetricCard
                  title="Open Interest"
                  value={`$${vaultStatistics.openInterest.toLocaleString()}`}
                />
              </div>
            </div>
          </section>
        </div>
      </main>
      
      <Footer dataSources={dataSources} />
    </div>
  );
};

export default Dashboard;
