import React, { useState } from 'react';
import { VaultFollower } from '../types';
import './TopDepositors.css';

interface TopDepositorsProps {
  depositors: VaultFollower[];
  maxDisplay?: number;
  leaderAddress?: string;
}

const TopDepositors: React.FC<TopDepositorsProps> = ({ depositors, maxDisplay = 10, leaderAddress }) => {
  const [showAll, setShowAll] = useState(false);
  
  const formatAddress = (address: string) => {
    // Check if this is the leader address and format it specially
    if (leaderAddress && (
      address.toLowerCase() === leaderAddress.toLowerCase() ||
      address.toLowerCase().includes('leader') ||
      address.toLowerCase().includes('ader')
    )) {
      return "Leader";
    }
    
    // Also check if the address contains "leader" in any form
    if (address.toLowerCase().includes('leader')) {
      return "Leader";
    }
    
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1000000) {
      return `$${formatNumber(num / 1000000, 1)}M`;
    } else if (num >= 1000) {
      return `$${formatNumber(num / 1000, 1)}K`;
    } else {
      return `$${formatNumber(num, 2)}`;
    }
  };

  // const formatPercentage = (num: number) => {
  //   return `${num >= 0 ? '+' : ''}${formatNumber(num, 2)}%`;
  // };


  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const displayDepositors = showAll ? depositors : depositors.slice(0, maxDisplay);
  const totalEquity = depositors.reduce((sum, depositor) => sum + parseFloat(depositor.vaultEquity), 0);

  return (
    <div className="top-depositors">
      <div className="depositors-table">
        <div className="table-header-info">
          <h2 className="section-title">Top Depositors</h2>
          <div className="depositors-summary">
            <span className="total-count">{depositors.length} Total Depositors</span>
            <span className="total-equity">Total Equity: {formatCurrency(totalEquity.toString())}</span>
          </div>
        </div>
        <div className="table-header">
          <div className="header-cell rank">#</div>
          <div className="header-cell address">Address</div>
          <div className="header-cell equity">Vault Equity</div>
          <div className="header-cell pnl">PnL</div>
          <div className="header-cell all-time-pnl">All-Time PnL</div>
          <div className="header-cell entry">Entry Date</div>
        </div>

        <div className="table-body">
          {displayDepositors.map((depositor, index) => {
            const pnl = parseFloat(depositor.pnl);
            const allTimePnl = parseFloat(depositor.allTimePnl);
            const equity = parseFloat(depositor.vaultEquity);
            const equityPercentage = totalEquity > 0 ? (equity / totalEquity) * 100 : 0;

            return (
              <div key={depositor.user} className="table-row">
                <div className="table-cell rank">
                  <span className={`rank-badge ${index < 3 ? 'top' : ''}`}>
                    {index + 1}
                  </span>
                </div>
                <div className="table-cell address">
                  <div className="address-container">
                    <span className="address-text">
                      {depositor.user.toLowerCase().includes('leader') || 
                       (leaderAddress && depositor.user.toLowerCase() === leaderAddress.toLowerCase()) 
                        ? "Leader" 
                        : formatAddress(depositor.user)}
                    </span>
                    <button 
                      className="copy-button" 
                      onClick={() => navigator.clipboard.writeText(depositor.user)}
                      title="Copy address"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#000000">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="table-cell equity">
                  <div className="equity-container">
                    <span className="equity-value">{formatCurrency(depositor.vaultEquity)}</span>
                    <span className="equity-percentage">({formatNumber(equityPercentage, 1)}%)</span>
                  </div>
                </div>
                <div className="table-cell pnl">
                  <span className={`pnl-value ${pnl >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(depositor.pnl)}
                  </span>
                </div>
                <div className="table-cell all-time-pnl">
                  <span className={`pnl-value ${allTimePnl >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(depositor.allTimePnl)}
                  </span>
                </div>
                <div className="table-cell entry">
                  <span className="entry-date">{formatDate(depositor.vaultEntryTime)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {depositors.length > maxDisplay && (
        <div className="show-more-container">
          <button 
            className="show-more-button"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : `Show All ${depositors.length} Depositors`}
          </button>
        </div>
      )}

      {depositors.length === 0 && (
        <div className="no-depositors">
          <div className="no-depositors-icon">👥</div>
          <h3>No Depositors Yet</h3>
          <p>This vault doesn't have any depositors at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default TopDepositors;
