import React from 'react';
import { useETHPrice } from '../hooks/useCryptoPrices';
import LoadingSpinner from './LoadingSpinner';
import './ETHTicker.css';

const ETHTicker: React.FC = () => {
  const { ethPrice, isLoading, error } = useETHPrice();
  
  if (isLoading) {
    return (
      <div className="eth-ticker">
        <div className="ticker-content">
          <span className="ticker-label">ETH</span>
          <LoadingSpinner size="small" />
        </div>
      </div>
    );
  }
  
  if (error || !ethPrice) {
    return (
      <div className="eth-ticker">
        <div className="ticker-content">
          <span className="ticker-label">ETH</span>
          <span className="ticker-price error">Error</span>
        </div>
      </div>
    );
  }
  
  const isPositive = ethPrice.dailyChangePercent >= 0;
  
  return (
    <div className="eth-ticker">
      <div className="ticker-content">
        <span className="ticker-label">ETH</span>
        <span className="ticker-price">${Math.round(ethPrice.current).toLocaleString()}</span>
        <span className={`ticker-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{ethPrice.dailyChangePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  );
};

export default ETHTicker;
