import React, { useState, useEffect, useRef } from 'react';
import { VaultMetrics, DataSource, ComprehensiveVaultMetrics, PositionNotification } from '../types';
import { mockVaultMetrics, mockDataSources } from '../data/mockData';
import { hyperliquidAPI } from '../services/api';
import { useSimplePrices } from '../hooks/useSimplePrices';
import { detectNewPositions, trackAllPositions, isFirstRun } from '../services/positionTracker';
import Header from './Header';
import MetricCard from './MetricCard';
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
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'initializing' | 'fetching-vault' | 'fetching-prices' | 'calculating' | 'complete'>('initializing');
  const [error, setError] = useState<string | null>(null);
  
  // ALP token balance state - hardcoded to 0
  const [alpBalance] = useState<number>(0);

  // Coming Soon email form state
  const [comingSoonEmail, setComingSoonEmail] = useState('');
  const [isSubmittingComingSoon, setIsSubmittingComingSoon] = useState(false);
  const [comingSoonSubmitStatus, setComingSoonSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Use simple prices hook - non-blocking
  const { ethPrice, btcPrice } = useSimplePrices();
  
  // Use refs to store latest prices without causing re-renders
  const ethPriceRef = useRef(ethPrice);
  const btcPriceRef = useRef(btcPrice);
  
  // Update refs when prices change
  useEffect(() => {
    ethPriceRef.current = ethPrice;
    btcPriceRef.current = btcPrice;
  }, [ethPrice, btcPrice]);


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
            
            // Fallback to known crypto prices for major assets (using refs to avoid dependency issues)
            if (coin === 'ETH') {
              return ethPriceRef.current?.current || 3000;
            } else if (coin === 'BTC') {
              return btcPriceRef.current?.current || 80000;
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
  }, []); // Empty dependency array - use refs to access latest prices

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



  // Initial data fetch - run in background without blocking UI
  useEffect(() => {
    const initializeData = async () => {
      // Fetch vault data in background without blocking Coming Soon display
      await fetchVaultData();
    };

    initializeData();
  }, [fetchVaultData]);

  // Real-time data updates
  useEffect(() => {
    const interval = setInterval(async () => {
      // Fetch vault data and ALP balance periodically (prices are handled by the hook)
      try {
        await fetchVaultData();
      } catch (error) {
        console.error('Real-time data update failed:', error);
      }
    }, 60000); // Update every 60 seconds (prices update every 30 seconds via hook)

    return () => clearInterval(interval);
  }, [fetchVaultData]); // Include fetch function


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

  // Mailchimp form submission handler
  const handleComingSoonEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comingSoonEmail) return;

    setIsSubmittingComingSoon(true);
    setComingSoonSubmitStatus('idle');

    try {
      const formData = new FormData();
      formData.append('EMAIL', comingSoonEmail);
      formData.append('u', '4e3f80ec414b40367852952ec');
      formData.append('id', 'dc4af6dff9');
      formData.append('f_id', '00728ce0f0');

      await fetch('https://vaulto.us15.list-manage.com/subscribe/post?u=4e3f80ec414b40367852952ec&id=dc4af6dff9&f_id=00728ce0f0', {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });

      setComingSoonSubmitStatus('success');
      setComingSoonEmail('');
    } catch (error) {
      setComingSoonSubmitStatus('error');
    } finally {
      setIsSubmittingComingSoon(false);
    }
  };

  return (
    <div className="dashboard">
      <Header />
      
      {/* Background Video */}
      <video 
        className="background-video" 
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      
      <main className="main-content">
        <div className="container">
          {/* Coming Soon Section */}
          <section className="coming-soon-section">
            <div className="coming-soon-content">
              <h1 className="coming-soon-title">Coming Soon</h1>
              <p className="coming-soon-description">
                We're building something amazing. Stay tuned for updates and be the first to know when we launch.
              </p>
              
              <form onSubmit={handleComingSoonEmailSubmit} className="coming-soon-email-form">
                <div className="coming-soon-input-group">
                  <input
                    type="email"
                    value={comingSoonEmail}
                    onChange={(e) => setComingSoonEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="coming-soon-email-input"
                    disabled={isSubmittingComingSoon || comingSoonSubmitStatus === 'success'}
                  />
                  <button 
                    type="submit" 
                    disabled={isSubmittingComingSoon || comingSoonSubmitStatus === 'success'}
                    className={`coming-soon-submit-btn ${comingSoonSubmitStatus === 'success' ? 'success' : ''}`}
                  >
                    {comingSoonSubmitStatus === 'success' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                    )}
                  </button>
                </div>
                {comingSoonSubmitStatus === 'success' && (
                  <p className="coming-soon-status success">Thanks! We'll keep you updated.</p>
                )}
                {comingSoonSubmitStatus === 'error' && (
                  <p className="coming-soon-status error">Please try again later.</p>
                )}
              </form>
              
              {/* Social Links */}
              <div className="coming-soon-social-links">
                <a href="https://youtube.com/@VaultoAi" target="_blank" rel="noopener noreferrer" title="YouTube">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a href="https://linkedin.com/company/vaulto" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="https://instagram.com/VaultoAi" target="_blank" rel="noopener noreferrer" title="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://x.com/VaultoAi" target="_blank" rel="noopener noreferrer" title="X (Twitter)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>
          </section>

          {/* Existing dashboard content hidden - keeping code intact for future use */}
          {false && (
            <>
          {/* Error Banner */}
          {error && (
            <div className="error-banner">
              <div className="error-message">
                ⚠️ {error}
              </div>
            </div>
          )}

          {/* Hero Section with ETH/BTC Prices */}
          <section className="hero-section">
            <div className="hero-content">
              <div className="hero-prices">
                <div className="hero-price eth-price-box">
                  <div className="price-label">Ethereum</div>
                  {ethPrice && (
                    <>
                      <div className="price-value">${Math.round(ethPrice!.current).toLocaleString('en-US')}</div>
                      <div className={`price-change ${ethPrice!.dailyChangePercent >= 0 ? 'positive' : 'negative'}`}>
                        {ethPrice!.dailyChangePercent >= 0 ? '+' : ''}{ethPrice!.dailyChangePercent.toFixed(2)}%
                      </div>
                    </>
                  )}
                  {!ethPrice && (
                    <>
                      <div className="price-value price-error">Price unavailable</div>
                      <div className="price-change price-error">Check connection</div>
                    </>
                  )}
                </div>
                <div className="hero-price btc-price-box">
                  <div className="price-label">Bitcoin</div>
                  {btcPrice && (
                    <>
                      <div className="price-value">${Math.round(btcPrice!.current).toLocaleString('en-US')}</div>
                      <div className={`price-change ${btcPrice!.dailyChangePercent >= 0 ? 'positive' : 'negative'}`}>
                        {btcPrice!.dailyChangePercent >= 0 ? '+' : ''}{btcPrice!.dailyChangePercent.toFixed(2)}%
                      </div>
                    </>
                  )}
                  {!btcPrice && (
                    <>
                      <div className="price-value price-error">Price unavailable</div>
                      <div className="price-change price-error">Check connection</div>
                    </>
                  )}
                </div>

              </div>
              <div className="hero-secondary hero-secondary-desktop">
                <div className="vault-info">
                  <div className="vault-header-with-logo">
                    <div className="vault-label">
                      Hyperliquid Vault
                    </div>
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
                  currentAPY={30}
                  alpTokenUrl="https://www.asterdex.com/en/earn/alp"
                />
              </div>
            </div>
          </section>


          {/* Primary Metrics Grid */}
          <section id="metrics" className="primary-metrics">
            <div className="metrics-grid">
              <MetricCard
                title="Vault NAV"
                value={`$${Math.round(vaultMetrics.vaultNav.usd).toLocaleString()}`}
                tooltip="Net Asset Value (NAV) represents the total value of the vault's assets minus liabilities. This is the fundamental measure of the vault's worth, calculated by summing all positions, cash, and other assets, then subtracting any outstanding debts or obligations."
              />
              
              <MetricCard
                title="Total Value"
                value={`$${Math.round(vaultMetrics.totalVaultValue.usd).toLocaleString()}`}
                tooltip="Total Vault Value represents the gross value of all assets under management, including leveraged positions and derivatives. Unlike NAV, this includes the full notional value of leveraged positions. For example, if the vault has $10,000 in capital with 2x leverage on ETH, the total vault value would be $20,000, while NAV would be $10,000 plus any unrealized gains or losses."
              />
              
              <MetricCard
                title="30D APR"
                value={`${comprehensiveMetrics?.vaultDetails?.apr ? ((comprehensiveMetrics?.vaultDetails?.apr || 0) * 100).toFixed(2) : '0.00'}%`}
                tooltip="30-Day Annual Percentage Rate (APR) represents the expected annual return on investment for vault depositors based on the last 30 days of performance. This is calculated based on the vault's recent historical performance and current strategy."
              />
              
              <MetricCard
                title="Leader Fraction"
                value={`${comprehensiveMetrics?.vaultDetails?.leaderFraction ? ((comprehensiveMetrics?.vaultDetails?.leaderFraction || 0) * 100).toFixed(2) : '0.00'}%`}
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
          {comprehensiveMetrics?.topDepositors && (comprehensiveMetrics?.topDepositors?.length ?? 0) > 0 && (
            <TopDepositors 
              depositors={comprehensiveMetrics!.topDepositors} 
              leaderAddress={comprehensiveMetrics!.vaultDetails?.leader || ''}
            />
          )}

          {/* Vault and ALP Info for Mobile (appears after Top Depositors) */}
          <section className="hero-secondary-mobile">
            <div className="combined-vault-alp-info">
              <div className="vault-section-compact">
                <div className="vault-section-header">
                  <div className="vault-section-title">Hyperliquid Vault</div>
                  <a href="https://app.hyperliquid.xyz/vaults/0xba9e8b2d5941a196288c6e22d1fab9aef6e0497a" target="_blank" rel="noopener noreferrer" className="section-link" title="View on Hyperliquid">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                    </svg>
                  </a>
                </div>
                <div className="vault-compact-address">
                  <span className="compact-address-text">0xba9e...497a</span>
                  <button className="compact-copy-button" onClick={() => navigator.clipboard.writeText('0xba9e8b2d5941a196288c6e22d1fab9aef6e0497a')} title="Copy Address">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#000000">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="alp-section-compact">
                <div className="alp-section-header">
                  <div className="alp-section-title">Aster Liquidity</div>
                  <a href="https://www.asterdex.com/en/earn/alp" target="_blank" rel="noopener noreferrer" className="section-link" title="View ALP Pool">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                    </svg>
                  </a>
                </div>
                <div className="alp-compact-info">
                  <div className="alp-compact-row">
                    <span className="alp-compact-label">Holdings:</span>
                    <span className="alp-compact-value">{alpBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ALP</span>
                  </div>
                  <div className="alp-compact-row">
                    <span className="alp-compact-label">APY:</span>
                    <span className="alp-compact-value alp-apy-compact">30%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
            </>
          )}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;


