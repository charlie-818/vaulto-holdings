import React from 'react';
import { PortfolioPerformance as PortfolioPerformanceType } from '../types';
import './PortfolioPerformance.css';

interface PortfolioPerformanceProps {
  performance: PortfolioPerformanceType;
}

const PortfolioPerformance: React.FC<PortfolioPerformanceProps> = ({ performance }) => {
  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${formatNumber(num, 2)}%`;
  };

  const formatCurrency = (num: number) => {
    if (Math.abs(num) >= 1000000) {
      return `$${formatNumber(num / 1000000, 1)}M`;
    } else if (Math.abs(num) >= 1000) {
      return `$${formatNumber(num / 1000, 1)}K`;
    } else {
      return `$${formatNumber(num, 2)}`;
    }
  };

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };

  const getRiskLevel = (value: number, type: 'volatility' | 'drawdown' | 'sharpe') => {
    if (type === 'volatility') {
      if (value < 10) return { level: 'Low', color: 'low' };
      if (value < 20) return { level: 'Medium', color: 'medium' };
      return { level: 'High', color: 'high' };
    }
    if (type === 'drawdown') {
      if (value < 5) return { level: 'Low', color: 'low' };
      if (value < 15) return { level: 'Medium', color: 'medium' };
      return { level: 'High', color: 'high' };
    }
    if (type === 'sharpe') {
      if (value > 1) return { level: 'Excellent', color: 'low' };
      if (value > 0.5) return { level: 'Good', color: 'medium' };
      return { level: 'Poor', color: 'high' };
    }
    return { level: 'Unknown', color: 'neutral' };
  };

  const volatilityRisk = getRiskLevel(performance.volatility, 'volatility');
  const drawdownRisk = getRiskLevel(performance.maxDrawdown, 'drawdown');
  const sharpeRisk = getRiskLevel(performance.sharpeRatio, 'sharpe');

  return (
    <div className="portfolio-performance">
      <div className="performance-header">
        <h2 className="section-title">Portfolio Performance</h2>
        <div className="performance-summary">
          <div className="summary-metric">
            <span className="summary-label">Total Return</span>
            <span className={`summary-value ${getPerformanceColor(performance.totalReturnPercent)}`}>
              {formatPercentage(performance.totalReturnPercent)}
            </span>
          </div>
          <div className="summary-metric">
            <span className="summary-label">Sharpe Ratio</span>
            <span className={`summary-value ${sharpeRisk.color}`}>
              {formatNumber(performance.sharpeRatio, 2)}
            </span>
          </div>
        </div>
      </div>

      <div className="performance-grid">
        <div className="performance-card returns">
          <h3 className="card-title">Returns</h3>
          <div className="returns-grid">
            <div className="return-item">
              <span className="return-label">Daily</span>
              <div className="return-values">
                <span className={`return-percent ${getPerformanceColor(performance.dailyReturnPercent)}`}>
                  {formatPercentage(performance.dailyReturnPercent)}
                </span>
                <span className={`return-amount ${getPerformanceColor(performance.dailyReturn)}`}>
                  {formatCurrency(performance.dailyReturn)}
                </span>
              </div>
            </div>
            <div className="return-item">
              <span className="return-label">Weekly</span>
              <div className="return-values">
                <span className={`return-percent ${getPerformanceColor(performance.weeklyReturnPercent)}`}>
                  {formatPercentage(performance.weeklyReturnPercent)}
                </span>
                <span className={`return-amount ${getPerformanceColor(performance.weeklyReturn)}`}>
                  {formatCurrency(performance.weeklyReturn)}
                </span>
              </div>
            </div>
            <div className="return-item">
              <span className="return-label">Monthly</span>
              <div className="return-values">
                <span className={`return-percent ${getPerformanceColor(performance.monthlyReturnPercent)}`}>
                  {formatPercentage(performance.monthlyReturnPercent)}
                </span>
                <span className={`return-amount ${getPerformanceColor(performance.monthlyReturn)}`}>
                  {formatCurrency(performance.monthlyReturn)}
                </span>
              </div>
            </div>
            <div className="return-item">
              <span className="return-label">All-Time</span>
              <div className="return-values">
                <span className={`return-percent ${getPerformanceColor(performance.allTimeReturnPercent)}`}>
                  {formatPercentage(performance.allTimeReturnPercent)}
                </span>
                <span className={`return-amount ${getPerformanceColor(performance.allTimeReturn)}`}>
                  {formatCurrency(performance.allTimeReturn)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="performance-card risk">
          <h3 className="card-title">Risk Metrics</h3>
          <div className="risk-grid">
            <div className="risk-item">
              <span className="risk-label">Volatility</span>
              <div className="risk-values">
                <span className={`risk-value ${volatilityRisk.color}`}>
                  {formatNumber(performance.volatility, 1)}%
                </span>
                <span className={`risk-level ${volatilityRisk.color}`}>
                  {volatilityRisk.level}
                </span>
              </div>
            </div>
            <div className="risk-item">
              <span className="risk-label">Max Drawdown</span>
              <div className="risk-values">
                <span className={`risk-value ${drawdownRisk.color}`}>
                  {formatNumber(performance.maxDrawdown, 1)}%
                </span>
                <span className={`risk-level ${drawdownRisk.color}`}>
                  {drawdownRisk.level}
                </span>
              </div>
            </div>
            <div className="risk-item">
              <span className="risk-label">Sharpe Ratio</span>
              <div className="risk-values">
                <span className={`risk-value ${sharpeRisk.color}`}>
                  {formatNumber(performance.sharpeRatio, 2)}
                </span>
                <span className={`risk-level ${sharpeRisk.color}`}>
                  {sharpeRisk.level}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="performance-insights">
        <h3 className="insights-title">Performance Insights</h3>
        <div className="insights-grid">
          <div className="insight-item">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <h4>Return Analysis</h4>
              <p>
                {performance.totalReturnPercent > 0 
                  ? `The vault has generated ${formatPercentage(performance.totalReturnPercent)} total returns, demonstrating strong performance.`
                  : `The vault has experienced ${formatPercentage(Math.abs(performance.totalReturnPercent))} total losses.`
                }
              </p>
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-icon">⚖️</div>
            <div className="insight-content">
              <h4>Risk Assessment</h4>
              <p>
                With a volatility of {formatNumber(performance.volatility, 1)}% and a Sharpe ratio of {formatNumber(performance.sharpeRatio, 2)}, 
                this vault shows {sharpeRisk.level.toLowerCase()} risk-adjusted returns.
              </p>
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-icon">🛡️</div>
            <div className="insight-content">
              <h4>Drawdown Protection</h4>
              <p>
                The maximum drawdown of {formatNumber(performance.maxDrawdown, 1)}% indicates {drawdownRisk.level.toLowerCase()} downside risk, 
                suggesting {drawdownRisk.level.toLowerCase()} capital preservation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPerformance;
