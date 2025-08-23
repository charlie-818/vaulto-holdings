import React from 'react';
import { VaultMetrics } from '../types';
import './ETHTicker.css';

interface ETHTickerProps {
  ethPrice: VaultMetrics['ethPrice'];
}

const ETHTicker: React.FC<ETHTickerProps> = ({ ethPrice }) => {
  const isPositive = ethPrice.dailyChangePercent >= 0;
  
  return (
    <div className="eth-ticker">
      <div className="ticker-content">
        <span className="ticker-label">ETH</span>
        <span className="ticker-price">${ethPrice.current.toLocaleString()}</span>
        <span className={`ticker-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{ethPrice.dailyChangePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  );
};

export default ETHTicker;
