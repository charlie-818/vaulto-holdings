import React from 'react';
import './ALPDisplay.css';

interface ALPDisplayProps {
  totalHoldings: number; // Amount of ALP tokens held
  currentAPY: number; // Current APY percentage (e.g., 30 for 30%)
  alpTokenUrl?: string; // URL to ALP token page
}

const ALPDisplay: React.FC<ALPDisplayProps> = ({
  totalHoldings,
  currentAPY,
  alpTokenUrl = 'https://www.asterdex.com/en/earn/alp'
}) => {
  return (
    <div className="alp-display">
      <div className="alp-header">
        <img src="/aster.png" alt="Aster" className="alp-logo" />
        <div className="alp-title">Aster</div>
      </div>
      
      <div className="alp-content">
        <div className="alp-row">
          <span className="alp-label">Holdings:</span>
          <span className="alp-value">{totalHoldings.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })} ALP</span>
        </div>
      </div>
      
      <div className="alp-footer">
        <a 
          href={alpTokenUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="alp-link"
          title="View ALP token page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
          View ALP Pool
        </a>
      </div>
    </div>
  );
};

export default ALPDisplay;

