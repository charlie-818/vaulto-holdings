import React from 'react';
import { VaultDetails as VaultDetailsType } from '../types';
import './VaultDetails.css';

interface VaultDetailsProps {
  vaultDetails: VaultDetailsType;
}

const VaultDetails: React.FC<VaultDetailsProps> = ({ vaultDetails }) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${formatNumber(num, 2)}%`;
  };

  return (
    <div className="vault-details">
      <div className="vault-details-header">
        <div className="vault-info">
          <h2 className="vault-name">{vaultDetails.name}</h2>
          <p className="vault-description">{vaultDetails.description}</p>
        </div>
        <div className="vault-status">
          <div className={`status-badge ${vaultDetails.isClosed ? 'closed' : 'open'}`}>
            {vaultDetails.isClosed ? 'Closed' : 'Open'}
          </div>
          <div className={`deposit-status ${vaultDetails.allowDeposits ? 'allowed' : 'disabled'}`}>
            {vaultDetails.allowDeposits ? 'Deposits Allowed' : 'Deposits Disabled'}
          </div>
        </div>
      </div>

      <div className="vault-details-grid">
        <div className="detail-card">
          <h3>Vault Information</h3>
          <div className="detail-row">
            <span className="label">Vault Address:</span>
            <span className="value address">
              {formatAddress(vaultDetails.vaultAddress)}
              <button 
                className="copy-button" 
                onClick={() => navigator.clipboard.writeText(vaultDetails.vaultAddress)}
                title="Copy vault address"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#000000">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
              </button>
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Leader:</span>
            <span className="value address">
              {formatAddress(vaultDetails.leader)}
              <button 
                className="copy-button" 
                onClick={() => navigator.clipboard.writeText(vaultDetails.leader)}
                title="Copy leader address"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#000000">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
              </button>
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Leader Fraction:</span>
            <span className="value">{formatPercentage(vaultDetails.leaderFraction * 100)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Leader Commission:</span>
            <span className="value">{formatPercentage(vaultDetails.leaderCommission * 100)}</span>
          </div>
        </div>

        <div className="detail-card">
          <h3>Financial Metrics</h3>
          <div className="detail-row">
            <span className="label">APR:</span>
            <span className="value positive">{formatPercentage(vaultDetails.apr * 100)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Max Distributable:</span>
            <span className="value">${formatNumber(vaultDetails.maxDistributable)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Max Withdrawable:</span>
            <span className="value">${formatNumber(vaultDetails.maxWithdrawable)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Total Followers:</span>
            <span className="value">{vaultDetails.followers.length}</span>
          </div>
        </div>

        {vaultDetails.relationship && vaultDetails.relationship.data && (
          <div className="detail-card">
            <h3>Vault Relationship</h3>
            <div className="detail-row">
              <span className="label">Type:</span>
              <span className="value">{vaultDetails.relationship.type}</span>
            </div>
            {vaultDetails.relationship.data.childAddresses && Array.isArray(vaultDetails.relationship.data.childAddresses) && (
              <div className="detail-row">
                <span className="label">Child Vaults:</span>
                <span className="value">{vaultDetails.relationship.data.childAddresses.length}</span>
              </div>
            )}
            {vaultDetails.relationship.data.parentAddress && (
              <div className="detail-row">
                <span className="label">Parent Vault:</span>
                <span className="value address">
                  {formatAddress(vaultDetails.relationship.data.parentAddress)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="vault-actions">
        <a 
          href={`https://app.hyperliquid.xyz/vaults/${vaultDetails.vaultAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="action-button primary"
        >
          View on Hyperliquid
        </a>
        <button 
          className="action-button secondary"
          onClick={() => navigator.clipboard.writeText(vaultDetails.vaultAddress)}
        >
          Copy Vault Address
        </button>
      </div>
    </div>
  );
};

export default VaultDetails;
