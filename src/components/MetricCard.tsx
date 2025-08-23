import React from 'react';
import './MetricCard.css';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: number;
    percent: number;
    period: string;
  };
  isDanger?: boolean;
  tooltip?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isDanger = false,
  tooltip
}) => {
  const isPositive = change && change.percent >= 0;
  
  return (
    <div className={`metric-card ${isDanger ? 'danger' : ''}`} title={tooltip}>
      <div className="metric-header">
        <h3 className="metric-title">{title}</h3>
        {tooltip && <span className="tooltip-icon">ⓘ</span>}
      </div>
      
      <div className="metric-value">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      
      {subtitle && (
        <div className="metric-subtitle">{subtitle}</div>
      )}
      
      {change && (
        <div className="metric-change">
          <span className={`change-value ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{change.value > 0 ? change.value.toFixed(2) : change.value.toFixed(2)}
          </span>
          <span className={`change-percent ${isPositive ? 'positive' : 'negative'}`}>
            ({isPositive ? '+' : ''}{change.percent.toFixed(2)}%)
          </span>
          <span className="change-period">{change.period}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
