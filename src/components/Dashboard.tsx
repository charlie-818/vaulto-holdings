import React, { useState, useEffect } from 'react';
import { VaultMetrics, PerformanceMetrics, DataSource, ETHPriceData } from '../types';
import { mockVaultMetrics, mockPerformanceMetrics, mockDataSources } from '../data/mockData';
import { marketAPI, hyperliquidAPI } from '../services/api';
import Header from './Header';
import MetricCard from './MetricCard';
import ETHPriceChart from './ETHPriceChart';
import Footer from './Footer';
import LoadingSpinner from './LoadingSpinner';
import './Dashboard.css';

interface Position {
  coin: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  leverage: number;
  liquidationPrice: number;
  marginUsed: number;
  returnOnEquity: number;
}

const Dashboard: React.FC = () => {
  const [vaultMetrics, setVaultMetrics] = useState<VaultMetrics>(mockVaultMetrics);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>(mockPerformanceMetrics);

  const [dataSources, setDataSources] = useState<DataSource[]>(mockDataSources);
  const [ethPriceData, setEthPriceData] = useState<ETHPriceData | null>(null);
  const [btcPriceData, setBtcPriceData] = useState<{ current: number; dailyChangePercent: number } | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState<'initializing' | 'fetching-vault' | 'fetching-prices' | 'calculating' | 'complete'>('initializing');
  const [error, setError] = useState<string | null>(null);

  // Fetch real vault data from Hyperliquid
  const fetchVaultData = async () => {
    try {
      setLoadingStage('fetching-vault');
      
      // Fetch vault state first
      const vaultState = await hyperliquidAPI.getVaultState();
      
      setLoadingStage('fetching-prices');
      
      // Try to fetch crypto prices with robust fallback system
      let cryptoPrices: { eth: ETHPriceData; btc: { current: number; dailyChangePercent: number } } | null = null;
      try {
        cryptoPrices = await marketAPI.getCryptoPrices();
        console.log('Fetched crypto prices successfully:', cryptoPrices);
      } catch (priceError) {
        console.error('Failed to fetch crypto prices:', priceError);
        // Don't set price data if fetch fails - let UI show error state
        setEthPriceData(null);
        setBtcPriceData(null);
      }
      
      setLoadingStage('calculating');
      
      // Use ETH price from vault state if crypto prices failed
      const ethPrice = cryptoPrices?.eth.current || 2450; // Fallback for calculations only
      
      const vaultData = hyperliquidAPI.transformVaultData(vaultState, ethPrice);
      const performanceData = hyperliquidAPI.calculatePerformanceMetrics(vaultState, ethPrice);
      
      setVaultMetrics(vaultData);
      setPerformanceMetrics(performanceData);
      
      // Only set price data if fetch was successful
      if (cryptoPrices) {
        setEthPriceData(cryptoPrices.eth);
        setBtcPriceData(cryptoPrices.btc);
      }
      
      // Extract positions from vault state with accurate current prices
      const positionData = vaultState.assetPositions.map((pos: any) => ({
        coin: pos.position.coin,
        size: parseFloat(pos.position.szi),
        entryPrice: parseFloat(pos.position.entryPx),
        currentPrice: pos.position.coin === 'ETH' ? (cryptoPrices?.eth.current || 2450) : 
                     pos.position.coin === 'BTC' ? (cryptoPrices?.btc.current || 112000) : 0,
        unrealizedPnl: parseFloat(pos.position.unrealizedPnl),
        leverage: pos.position.leverage.value,
        liquidationPrice: parseFloat(pos.position.liquidationPx),
        marginUsed: parseFloat(pos.position.marginUsed),
        returnOnEquity: parseFloat(pos.position.returnOnEquity)
      }));
      
      setPositions(positionData);
      
      // Update data sources with real-time timestamps
      setDataSources([
        {
          name: 'CoinGecko',
          url: 'https://coingecko.com',
          lastUpdated: new Date()
        },
        {
          name: 'Hyperliquid',
          url: 'https://hyperliquid.xyz',
          lastUpdated: new Date()
        },
        {
          name: 'Vaulto Holdings',
          url: 'https://vaulto.ai',
          lastUpdated: new Date()
        }
      ]);
      
      setLoadingStage('complete');
      setError(null);
    } catch (error) {
      console.error('Error fetching vault data:', error);
      setError('Failed to load vault data. Using cached data.');
      // Keep existing data if API fails
    }
  };



  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setLoadingStage('initializing');
      
      // Simulate a brief initialization delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await fetchVaultData();
      
      // Brief delay before hiding loading to show completion
      await new Promise(resolve => setTimeout(resolve, 200));
      setLoading(false);
    };

    initializeData();
    
    // Add debug functions to window for testing
    (window as any).debugVaultoPrices = async () => {
      console.log('=== Vaulto Price Debug ===');
      console.log('Cache status:', marketAPI.getCacheStatus());
      console.log('Testing price fetch...');
      const result = await marketAPI.testPriceFetching();
      console.log('Test result:', result);
      return result;
    };
    

  }, []);

  // Real-time data updates
  useEffect(() => {
    const interval = setInterval(async () => {
      // Check if price data is stale before fetching
      if (marketAPI.isPriceDataStale()) {
        await fetchVaultData();
      } else {
        // Only fetch vault data if prices are fresh
        try {
          const vaultState = await hyperliquidAPI.getVaultState();
          
          // Try to fetch crypto prices
          try {
            const cryptoPrices = await marketAPI.getCryptoPrices();
            const vaultData = hyperliquidAPI.transformVaultData(vaultState, cryptoPrices.eth.current);
            const performanceData = hyperliquidAPI.calculatePerformanceMetrics(vaultState, cryptoPrices.eth.current);
            
            setVaultMetrics(vaultData);
            setPerformanceMetrics(performanceData);
            setEthPriceData(cryptoPrices.eth);
            setBtcPriceData(cryptoPrices.btc);
            setError(null);
          } catch (priceError) {
            console.error('Failed to fetch crypto prices in periodic update:', priceError);
            // Keep existing vault data but clear price data
            setEthPriceData(null);
            setBtcPriceData(null);
            setError('Price data unavailable. Vault data updated.');
          }
        } catch (error) {
          console.error('Error in periodic vault data update:', error);
          setError('Failed to update vault data. Retrying...');
        }
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    const getLoadingMessage = () => {
      switch (loadingStage) {
        case 'initializing':
          return 'Initializing dashboard';
        case 'fetching-vault':
          return 'Fetching vault data';
        case 'fetching-prices':
          return 'Fetching market prices';
        case 'calculating':
          return 'Calculating metrics';
        case 'complete':
          return 'Loading complete';
        default:
          return 'Loading real-time vault data';
      }
    };

    return (
      <div className="dashboard">
        <Header />
        <main className="main-content">
          <div className="container">
            <LoadingSpinner 
              message={getLoadingMessage()}
              size="large"
            />
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
          {/* Error Banner */}
          {error && (
            <div className="error-banner">
              <div className="error-message">
                ⚠️ {error}
              </div>
            </div>
          )}

          {/* Hero Section with ETH/BTC Prices and Vault Address */}
          <section className="hero-section">
            <div className="hero-content">
              <div className="hero-prices">
                <div className="hero-price eth-price-box">
                  <div className="price-label">ETH Price</div>
                  {ethPriceData ? (
                    <>
                      <div className="price-value">${Math.round(ethPriceData.current).toLocaleString()}</div>
                      <div className={`price-change ${ethPriceData.dailyChangePercent >= 0 ? 'positive' : 'negative'}`}>
                        {ethPriceData.dailyChangePercent >= 0 ? '+' : ''}{ethPriceData.dailyChangePercent.toFixed(2)}%
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="price-value price-error">Price Unavailable</div>
                      <div className="price-change price-error">Check Connection</div>
                    </>
                  )}
                </div>
                <div className="hero-price btc-price-box">
                  <div className="price-label">BTC Price</div>
                  {btcPriceData ? (
                    <>
                      <div className="price-value">${Math.round(btcPriceData.current).toLocaleString()}</div>
                      <div className={`price-change ${btcPriceData.dailyChangePercent >= 0 ? 'positive' : 'negative'}`}>
                        {btcPriceData.dailyChangePercent >= 0 ? '+' : ''}{btcPriceData.dailyChangePercent.toFixed(2)}%
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="price-value price-error">Price Unavailable</div>
                      <div className="price-change price-error">Check Connection</div>
                    </>
                  )}
                </div>

              </div>
              <div className="vault-info">
                <div className="vault-label">Vaulto Holdings Vault</div>
                <div className="vault-address">
                  <span className="address-text">0xba9e8b2d5941a196288c6e22d1fab9aef6e0497a</span>
                  <button className="copy-button" onClick={() => navigator.clipboard.writeText('0xba9e8b2d5941a196288c6e22d1fab9aef6e0497a')} title="Copy Vaulto Holdings Vault Address">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                  </button>
                </div>

                <div className="vault-link">
                  <a 
                    href="https://app.hyperliquid.xyz/vaults/0xba9e8b2d5941a196288c6e22d1fab9aef6e0497a" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="vault-link-button"
                    title="View vault on Hyperliquid"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                    </svg>
                    View on Hyperliquid
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Primary Metrics Grid */}
          <section id="metrics" className="primary-metrics">
            <div className="metrics-grid">
              <MetricCard
                title="ETH Net Exposure"
                value={`${vaultMetrics.ethNetExposure.value.toFixed(2)}x ETH`}
                change={{
                  value: vaultMetrics.ethNetExposure.dailyChange,
                  percent: vaultMetrics.ethNetExposure.dailyChangePercent,
                  period: '24h'
                }}
                tooltip="The total leveraged exposure to Ethereum across all positions. This represents the net directional bet on ETH price movements, combining long and short positions. A value of 2.15x means the vault has 2.15 times the vault's capital exposed to ETH price movements."
              />
              
              <MetricCard
                title="Liquidation Price"
                value={`$${vaultMetrics.liquidationPrice.value.toFixed(2)}`}
                subtitle={`${((vaultMetrics.liquidationPrice.distance / vaultMetrics.liquidationPrice.currentEthPrice) * 100).toFixed(2)}% from current price`}
                isDanger={vaultMetrics.liquidationPrice.isDangerZone}
                tooltip="The ETH price at which the vault's leveraged positions would be automatically liquidated by the exchange. This is calculated based on the vault's current margin and leverage. When ETH price approaches this level, the card turns red to indicate increased risk. The percentage shows how close the current price is to liquidation."
              />
              
              <MetricCard
                title="Vault NAV"
                value={`$${vaultMetrics.vaultNav.usd.toFixed(2)}`}
                subtitle={`${vaultMetrics.vaultNav.eth.toFixed(2)} ETH`}
                tooltip="Net Asset Value (NAV) represents the total value of the vault's assets minus liabilities. This is the fundamental measure of the vault's worth, calculated by summing all positions, cash, and other assets, then subtracting any outstanding debts or obligations. The NAV is displayed in both USD and ETH equivalent."
              />
              
              <MetricCard
                title="Total Vault Value"
                value={`$${vaultMetrics.totalVaultValue.usd.toFixed(2)}`}
                subtitle={`${vaultMetrics.totalVaultValue.eth.toFixed(2)} ETH`}
                tooltip="Total Vault Value represents the gross value of all assets under management, including leveraged positions and derivatives. Unlike NAV, this includes the full notional value of leveraged positions. For example, if the vault has $10,000 in capital with 2x leverage on ETH, the total vault value would be $20,000, while NAV would be $10,000 plus any unrealized gains or losses."
              />
            </div>
          </section>

          {/* Positions Section */}
          {positions.length > 0 && (
            <section id="positions" className="positions-section">
              <h2 className="section-title">Current Positions</h2>
              <div className="positions-grid">
                {positions.map((position, index) => (
                  <div key={index} className="position-card">
                    <div className="position-header">
                      <div className="position-asset">{position.coin}</div>
                      <div className={`position-pnl ${position.unrealizedPnl >= 0 ? 'positive' : 'negative'}`}>
                        ${position.unrealizedPnl.toFixed(2)}
                      </div>
                    </div>
                    <div className="position-details">
                      <div className="position-row">
                        <span className="label">Size:</span>
                        <span className="value">{position.size.toFixed(2)} {position.coin}</span>
                      </div>
                      <div className="position-row">
                        <span className="label">Entry Price:</span>
                        <span className="value">${position.entryPrice.toFixed(2)}</span>
                      </div>
                      <div className="position-row">
                        <span className="label">Leverage:</span>
                        <span className="value">{position.leverage.toFixed(2)}x</span>
                      </div>
                      <div className="position-row">
                        <span className="label">Liquidation Price:</span>
                        <span className="value">${position.liquidationPrice.toFixed(2)}</span>
                      </div>
                      <div className="position-row">
                        <span className="label">ROE:</span>
                        <span className={`value ${position.returnOnEquity >= 0 ? 'positive' : 'negative'}`}>
                          {(position.returnOnEquity * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Performance Section */}
          <section id="performance" className="performance-section">
            <div className="performance-grid">
              <div className="performance-metrics">
                <div className="performance-cards">
                  <MetricCard
                    title="Total Return"
                    value={`${performanceMetrics.inception.returnPercent.toFixed(2)}%`}
                    subtitle={`$${performanceMetrics.inception.returnUsd.toFixed(2)}`}
                  />
                  <MetricCard
                    title="30-Day Return"
                    value={`${performanceMetrics.monthly.returnPercent.toFixed(2)}%`}
                    subtitle={`$${performanceMetrics.monthly.returnUsd.toFixed(2)}`}
                  />
                  <MetricCard
                    title="Daily Return"
                    value={`${performanceMetrics.daily.returnPercent.toFixed(2)}%`}
                    subtitle={`$${performanceMetrics.daily.returnUsd.toFixed(2)}`}
                  />
                </div>
              </div>
              
              {/* ETH Price Chart - Inline with performance metrics */}
              <div className="chart-wrapper">
                <ETHPriceChart />
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
