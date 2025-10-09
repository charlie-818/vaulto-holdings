import React, { useState, useEffect } from 'react';
import { VaultMetrics, DataSource, ComprehensiveVaultMetrics, PositionNotification } from '../types';
import { mockVaultMetrics, mockDataSources } from '../data/mockData';
import { hyperliquidAPI } from '../services/api';
import { useSimplePrices } from '../hooks/useSimplePrices';
import { detectNewPositions, trackAllPositions, isFirstRun } from '../services/positionTracker';
import { etherscanAPI } from '../services/etherscanApi';
import Header from './Header';
import MetricCard from './MetricCard';
import Footer from './Footer';
import LoadingSpinner from './LoadingSpinner';
import TopDepositors from './TopDepositors';
import ALPDisplay from './ALPDisplay';
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
  const [comprehensiveMetrics, setComprehensiveMetrics] = useState<ComprehensiveVaultMetrics | null>(null);

  const [dataSources, setDataSources] = useState<DataSource[]>(mockDataSources);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState<'initializing' | 'fetching-vault' | 'fetching-prices' | 'calculating' | 'complete'>('initializing');
  const [error, setError] = useState<string | null>(null);
  
  // ALP token balance state
  const [alpBalance, setAlpBalance] = useState<number>(0);

  // Use simple prices hook - non-blocking
  const { ethPrice, btcPrice } = useSimplePrices();

  // Fetch ALP token balance from Etherscan
  const fetchALPBalance = React.useCallback(async () => {
    try {
      const balance = await etherscanAPI.getALPBalance();
      setAlpBalance(balance);
      console.log('ALP balance updated:', balance);
    } catch (error) {
      console.error('Failed to fetch ALP balance:', error);
      // Keep previous balance or set to 0 if first fetch
      if (alpBalance === 0) {
        setAlpBalance(0);
      }
    }
  }, [alpBalance]);

  // Fetch comprehensive vault data from Hyperliquid
  const fetchVaultData = React.useCallback(async () => {
    try {
      setLoadingStage('fetching-vault');
      
      // Fetch comprehensive vault metrics with error handling
      let comprehensiveData: ComprehensiveVaultMetrics | null = null;
      try {
        comprehensiveData = await hyperliquidAPI.getComprehensiveVaultMetrics();
        setComprehensiveMetrics(comprehensiveData);
      } catch (vaultError) {
        console.log('Failed to fetch vault data:', vaultError);
        // Create mock comprehensive data to prevent crashes
        comprehensiveData = {
          ...mockVaultMetrics,
          vaultDetails: {
            name: 'Vaulto Holdings',
            vaultAddress: '0xba9e8b2d5941a196288c6e22d1fab9aef6e0497a',
            leader: '0x0000000000000000000000000000000000000000',
            description: 'Community-owned vault providing liquidity to Hyperliquid through multiple market making strategies.',
            portfolio: [],
            apr: 0.36,
            followerState: null,
            leaderFraction: 0.0008,
            leaderCommission: 0,
            followers: [],
            maxDistributable: 0,
            maxWithdrawable: 0,
            isClosed: false,
            allowDeposits: true,
            alwaysCloseOnWithdraw: false
          },
          topDepositors: [],
          portfolioPerformance: {
            totalReturn: 0,
            totalReturnPercent: 0,
            dailyReturn: 0,
            dailyReturnPercent: 0,
            weeklyReturn: 0,
            weeklyReturnPercent: 0,
            monthlyReturn: 0,
            monthlyReturnPercent: 0,
            allTimeReturn: 0,
            allTimeReturnPercent: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            volatility: 0
          },
          riskMetrics: {
            var95: 0,
            var99: 0,
            maxLeverage: 0,
            currentLeverage: 0,
            liquidationRisk: 0,
            concentrationRisk: 0,
            correlationRisk: 0
          }
        };
        setComprehensiveMetrics(comprehensiveData);
      }
      
      setLoadingStage('calculating');
      
      
      // Set basic metrics from comprehensive data (with fallback)
      if (comprehensiveData) {
        console.log('Comprehensive data portfolio performance:', comprehensiveData.portfolioPerformance);
        setVaultMetrics({
          ethNetExposure: comprehensiveData.ethNetExposure,
          totalLeverage: comprehensiveData.totalLeverage,
          liquidationPrice: comprehensiveData.liquidationPrice,
          vaultNav: comprehensiveData.vaultNav,
          totalVaultValue: comprehensiveData.totalVaultValue,
          ethPrice: comprehensiveData.ethPrice
        });
        
      }
      
      // Price data is now handled by the useCryptoPrices hook
      
      // Extract positions from vault state with accurate current prices
      try {
        const vaultState = await hyperliquidAPI.getVaultState();
        
        // Get current prices for all assets in positions using the new Hyperliquid API
        const getCurrentPrice = async (coin: string) => {
          try {
            // Use the new getAssetPrice function that fetches accurate current market prices
            const currentPrice = await hyperliquidAPI.getAssetPrice(coin);
            return currentPrice;
          } catch (error) {
            console.log(`Failed to get ${coin} price from Hyperliquid API:`, error);
            
            // Fallback to known crypto prices for major assets
            if (coin === 'ETH') {
              return ethPrice?.current || 2450;
            } else if (coin === 'BTC') {
              return btcPrice?.current || 112000;
            }
            
            // Return 0 if no price can be found
            return 0;
          }
        };
        
        // Process positions with proper price fetching
        const positionData = await Promise.all(
          vaultState.assetPositions.map(async (pos: any) => {
            const currentPrice = await getCurrentPrice(pos.position.coin);
            const entryPrice = parseFloat(pos.position.entryPx);
            
            return {
              coin: pos.position.coin,
              size: parseFloat(pos.position.szi),
              entryPrice: entryPrice,
              currentPrice: currentPrice > 0 ? currentPrice : entryPrice, // Use entry price as fallback if current price is 0
              unrealizedPnl: parseFloat(pos.position.unrealizedPnl),
              leverage: pos.position.leverage.value,
              liquidationPrice: parseFloat(pos.position.liquidationPx),
              marginUsed: parseFloat(pos.position.marginUsed),
              returnOnEquity: parseFloat(pos.position.returnOnEquity)
            };
          })
        );
        
        setPositions(positionData);
        
        // Check for new positions and send webhooks
        if (!isFirstRun()) {
          const newPositions = detectNewPositions(positionData);
          
          if (newPositions.length > 0) {
            console.log(`Detected ${newPositions.length} new position(s)`);
            
            // Send webhook for each new position
            for (const position of newPositions) {
              try {
                await sendPositionWebhook(position);
                console.log(`Webhook sent for new ${position.asset} position`);
              } catch (webhookError) {
                console.error(`Failed to send webhook for ${position.asset}:`, webhookError);
              }
            }
          }
        } else {
          // First run - track all current positions without sending webhooks
          console.log('First run - tracking current positions without sending webhooks');
          trackAllPositions(positionData);
        }
      } catch (positionError) {
        console.error('Failed to fetch positions:', positionError);
        setPositions([]);
      }
      
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
      console.log('Error fetching vault data:', error);
      setError('Failed to load vault data. Using cached data.');
      // Keep existing data if API fails
    }
  }, [ethPrice, btcPrice]);

  // Function to send position webhook (automatic only)
  const sendPositionWebhook = async (positionData: PositionNotification): Promise<void> => {
    try {
      const response = await fetch('/.netlify/functions/send-position-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(positionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send webhook');
      }

      console.log('Webhook sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Error sending webhook:', error);
      throw error;
    }
  };



  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setLoadingStage('initializing');
      
      // Simulate a brief initialization delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Fetch both vault data and ALP balance in parallel
      await Promise.all([
        fetchVaultData(),
        fetchALPBalance()
      ]);
      
      // Brief delay before hiding loading to show completion
      await new Promise(resolve => setTimeout(resolve, 200));
      setLoading(false);
    };

    initializeData();
  }, [fetchVaultData, fetchALPBalance]);

  // Real-time data updates
  useEffect(() => {
    const interval = setInterval(async () => {
      // Fetch vault data and ALP balance periodically (prices are handled by the hook)
      try {
        await Promise.all([
          fetchVaultData(),
          fetchALPBalance()
        ]);
      } catch (error) {
        console.error('Real-time data update failed:', error);
      }
    }, 60000); // Update every 60 seconds (prices update every 30 seconds via hook)

    return () => clearInterval(interval);
  }, [fetchVaultData, fetchALPBalance]); // Include both fetch functions


  // Calculate optimal grid columns for balanced layout
  const getOptimalColumns = (count: number): number => {
    // For 1-4 cards: all in one row
    if (count <= 4) return count;
    
    // For 5+ cards: use ceiling of count/2 to ensure last row has at most one less card
    // Examples: 5->3, 6->3, 7->4, 8->4, 9->5, 10->5, etc.
    return Math.ceil(count / 2);
  };

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
                  <div className="price-label">Ethereum (ETH)</div>
                  {ethPrice ? (
                    <>
                      <div className="price-value">${Math.round(ethPrice.current).toLocaleString('en-US')}</div>
                      <div className={`price-change ${ethPrice.dailyChangePercent >= 0 ? 'positive' : 'negative'}`}>
                        {ethPrice.dailyChangePercent >= 0 ? '+' : ''}{ethPrice.dailyChangePercent.toFixed(2)}%
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="price-value price-error">Price unavailable</div>
                      <div className="price-change price-error">Check connection</div>
                    </>
                  )}
                </div>
                <div className="hero-price btc-price-box">
                  <div className="price-label">Bitcoin (BTC)</div>
                  {btcPrice ? (
                    <>
                      <div className="price-value">${Math.round(btcPrice.current).toLocaleString('en-US')}</div>
                      <div className={`price-change ${btcPrice.dailyChangePercent >= 0 ? 'positive' : 'negative'}`}>
                        {btcPrice.dailyChangePercent >= 0 ? '+' : ''}{btcPrice.dailyChangePercent.toFixed(2)}%
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="price-value price-error">Price unavailable</div>
                      <div className="price-change price-error">Check connection</div>
                    </>
                  )}
                </div>

              </div>
              <div className="hero-secondary">
                <div className="vault-info">
                  <div className="vault-header-with-logo">
                    <img src="/hyper.png" alt="Hyperliquid" className="vault-logo" />
                    <div className="vault-label">Vault</div>
                  </div>
                  <div className="vault-address">
                    <span className="address-text">0xba9e...497a</span>
                    <button className="copy-button" onClick={() => navigator.clipboard.writeText('0xba9e8b2d5941a196288c6e22d1fab9aef6e0497a')} title="Copy Full Address: 0xba9e8b2d5941a196288c6e22d1fab9aef6e0497a">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#000000">
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

                <ALPDisplay 
                  totalHoldings={alpBalance}
                  currentAPY={30.5}
                  alpTokenUrl="https://www.asterdex.com/en/earn/alp"
                />
              </div>
            </div>
          </section>


          {/* Primary Metrics Grid */}
          <section id="metrics" className="primary-metrics">
            <div className="metrics-grid">
              <MetricCard
                title="30D APR"
                value={`${comprehensiveMetrics?.vaultDetails?.apr ? (comprehensiveMetrics.vaultDetails.apr * 100).toFixed(2) : '0.00'}%`}
                tooltip="30-Day Annual Percentage Rate (APR) represents the expected annual return on investment for vault depositors based on the last 30 days of performance. This is calculated based on the vault's recent historical performance and current strategy."
              />
              
              <MetricCard
                title="Vault NAV"
                value={`$${vaultMetrics.vaultNav.usd.toFixed(2)}`}
                tooltip="Net Asset Value (NAV) represents the total value of the vault's assets minus liabilities. This is the fundamental measure of the vault's worth, calculated by summing all positions, cash, and other assets, then subtracting any outstanding debts or obligations."
              />
              
              <MetricCard
                title="Total Vault Value"
                value={`$${vaultMetrics.totalVaultValue.usd.toFixed(2)}`}
                tooltip="Total Vault Value represents the gross value of all assets under management, including leveraged positions and derivatives. Unlike NAV, this includes the full notional value of leveraged positions. For example, if the vault has $10,000 in capital with 2x leverage on ETH, the total vault value would be $20,000, while NAV would be $10,000 plus any unrealized gains or losses."
              />
              
              <MetricCard
                title="Leader Fraction"
                value={`${comprehensiveMetrics?.vaultDetails?.leaderFraction ? (comprehensiveMetrics.vaultDetails.leaderFraction * 100).toFixed(2) : '0.00'}%`}
                tooltip="The leader fraction represents the percentage of the vault's total value that belongs to the vault leader. This shows how much of the vault's capital is owned by the leader versus depositors."
              />
            </div>
          </section>

          {/* Positions Section */}
          {positions.length > 0 && (
            <section id="positions" className="positions-section">
              <div 
                className="positions-grid"
                style={{
                  '--grid-cols': getOptimalColumns(positions.length)
                } as React.CSSProperties}
              >
                {positions
                  .sort((a, b) => b.unrealizedPnl - a.unrealizedPnl)
                  .map((position, index) => (
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
                        <span className="label">Leverage:</span>
                        <span className="value">{position.leverage.toFixed(2)}x</span>
                      </div>
                      <div className="position-row">
                        <span className="label">Entry Price:</span>
                        <span className="value">${position.entryPrice.toFixed(2)}</span>
                      </div>
                      <div className="position-row">
                        <span className="label">Current Price:</span>
                        <span className="value">${position.currentPrice.toFixed(2)}</span>
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



          {/* Top Depositors */}
          {comprehensiveMetrics && comprehensiveMetrics.topDepositors.length > 0 && (
            <TopDepositors 
              depositors={comprehensiveMetrics.topDepositors} 
              leaderAddress={comprehensiveMetrics.vaultDetails.leader}
            />
          )}

        </div>
      </main>
      
      <Footer dataSources={dataSources} />
    </div>
  );
};

export default Dashboard;
