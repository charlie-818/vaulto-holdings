import React from 'react';
import { RiskMetrics as RiskMetricsType } from '../types';
import './RiskMetrics.css';

interface RiskMetricsProps {
  riskMetrics: RiskMetricsType;
}

const RiskMetrics: React.FC<RiskMetricsProps> = ({ riskMetrics }) => {
  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
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

  const getRiskLevel = (value: number, type: 'var' | 'leverage' | 'risk') => {
    if (type === 'var') {
      if (value < 1000) return { level: 'Low', color: 'low', description: 'Minimal potential loss' };
      if (value < 5000) return { level: 'Medium', color: 'medium', description: 'Moderate potential loss' };
      return { level: 'High', color: 'high', description: 'Significant potential loss' };
    }
    if (type === 'leverage') {
      if (value < 2) return { level: 'Conservative', color: 'low', description: 'Low leverage strategy' };
      if (value < 5) return { level: 'Moderate', color: 'medium', description: 'Balanced leverage' };
      return { level: 'Aggressive', color: 'high', description: 'High leverage strategy' };
    }
    if (type === 'risk') {
      if (value < 20) return { level: 'Low', color: 'low', description: 'Low risk exposure' };
      if (value < 50) return { level: 'Medium', color: 'medium', description: 'Moderate risk exposure' };
      return { level: 'High', color: 'high', description: 'High risk exposure' };
    }
    return { level: 'Unknown', color: 'neutral', description: 'Risk level unknown' };
  };

  const var95Risk = getRiskLevel(riskMetrics.var95, 'var');
  const var99Risk = getRiskLevel(riskMetrics.var99, 'var');
  const leverageRisk = getRiskLevel(riskMetrics.currentLeverage, 'leverage');
  const liquidationRisk = getRiskLevel(riskMetrics.liquidationRisk, 'risk');
  const concentrationRisk = getRiskLevel(riskMetrics.concentrationRisk, 'risk');
  const correlationRisk = getRiskLevel(riskMetrics.correlationRisk, 'risk');

  return (
    <div className="risk-metrics">
      <div className="risk-header">
        <h2 className="section-title">Risk Metrics</h2>
        <div className="risk-summary">
          <div className="summary-metric">
            <span className="summary-label">Current Leverage</span>
            <span className={`summary-value ${leverageRisk.color}`}>
              {formatNumber(riskMetrics.currentLeverage, 2)}x
            </span>
          </div>
          <div className="summary-metric">
            <span className="summary-label">Max Leverage</span>
            <span className={`summary-value ${riskMetrics.maxLeverage > 5 ? 'high' : riskMetrics.maxLeverage > 2 ? 'medium' : 'low'}`}>
              {formatNumber(riskMetrics.maxLeverage, 2)}x
            </span>
          </div>
        </div>
      </div>

      <div className="risk-grid">
        <div className="risk-card var">
          <h3 className="card-title">Value at Risk (VaR)</h3>
          <div className="var-grid">
            <div className="var-item">
              <div className="var-header">
                <span className="var-label">95% VaR</span>
                <span className={`var-level ${var95Risk.color}`}>
                  {var95Risk.level}
                </span>
              </div>
              <div className="var-value">
                {formatCurrency(riskMetrics.var95)}
              </div>
              <div className="var-description">
                {var95Risk.description}
              </div>
            </div>
            <div className="var-item">
              <div className="var-header">
                <span className="var-label">99% VaR</span>
                <span className={`var-level ${var99Risk.color}`}>
                  {var99Risk.level}
                </span>
              </div>
              <div className="var-value">
                {formatCurrency(riskMetrics.var99)}
              </div>
              <div className="var-description">
                {var99Risk.description}
              </div>
            </div>
          </div>
        </div>

        <div className="risk-card leverage">
          <h3 className="card-title">Leverage Analysis</h3>
          <div className="leverage-grid">
            <div className="leverage-item">
              <span className="leverage-label">Current Leverage</span>
              <div className="leverage-values">
                <span className={`leverage-value ${leverageRisk.color}`}>
                  {formatNumber(riskMetrics.currentLeverage, 2)}x
                </span>
                <span className={`leverage-level ${leverageRisk.color}`}>
                  {leverageRisk.level}
                </span>
              </div>
            </div>
            <div className="leverage-item">
              <span className="leverage-label">Max Leverage</span>
              <div className="leverage-values">
                <span className={`leverage-value ${riskMetrics.maxLeverage > 5 ? 'high' : riskMetrics.maxLeverage > 2 ? 'medium' : 'low'}`}>
                  {formatNumber(riskMetrics.maxLeverage, 2)}x
                </span>
                <span className="leverage-description">
                  Maximum allowed leverage
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="risk-card exposure">
          <h3 className="card-title">Risk Exposure</h3>
          <div className="exposure-grid">
            <div className="exposure-item">
              <div className="exposure-header">
                <span className="exposure-label">Liquidation Risk</span>
                <span className={`exposure-level ${liquidationRisk.color}`}>
                  {liquidationRisk.level}
                </span>
              </div>
              <div className="exposure-value">
                {formatNumber(riskMetrics.liquidationRisk, 1)}%
              </div>
              <div className="exposure-description">
                {liquidationRisk.description}
              </div>
            </div>
            <div className="exposure-item">
              <div className="exposure-header">
                <span className="exposure-label">Concentration Risk</span>
                <span className={`exposure-level ${concentrationRisk.color}`}>
                  {concentrationRisk.level}
                </span>
              </div>
              <div className="exposure-value">
                {formatNumber(riskMetrics.concentrationRisk, 1)}%
              </div>
              <div className="exposure-description">
                {concentrationRisk.description}
              </div>
            </div>
            <div className="exposure-item">
              <div className="exposure-header">
                <span className="exposure-label">Correlation Risk</span>
                <span className={`exposure-level ${correlationRisk.color}`}>
                  {correlationRisk.level}
                </span>
              </div>
              <div className="exposure-value">
                {formatNumber(riskMetrics.correlationRisk, 1)}%
              </div>
              <div className="exposure-description">
                {correlationRisk.description}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="risk-insights">
        <h3 className="insights-title">Risk Assessment</h3>
        <div className="insights-grid">
          <div className="insight-item">
            <div className="insight-icon">⚠️</div>
            <div className="insight-content">
              <h4>Leverage Analysis</h4>
              <p>
                Current leverage of {formatNumber(riskMetrics.currentLeverage, 2)}x indicates a {leverageRisk.level.toLowerCase()} strategy. 
                Maximum leverage of {formatNumber(riskMetrics.maxLeverage, 2)}x shows the vault's risk capacity.
              </p>
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-icon">🛡️</div>
            <div className="insight-content">
              <h4>Downside Protection</h4>
              <p>
                With 95% VaR of {formatCurrency(riskMetrics.var95)} and 99% VaR of {formatCurrency(riskMetrics.var99)}, 
                the vault has {var95Risk.level.toLowerCase()} downside risk exposure.
              </p>
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-icon">📊</div>
            <div className="insight-content">
              <h4>Portfolio Diversification</h4>
              <p>
                Concentration risk of {formatNumber(riskMetrics.concentrationRisk, 1)}% and correlation risk of {formatNumber(riskMetrics.correlationRisk, 1)}% 
                indicate {concentrationRisk.level.toLowerCase()} portfolio diversification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMetrics;
