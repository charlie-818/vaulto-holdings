import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isPositive = change && change.percent >= 0;
  
  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const handleInfoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTooltip(!showTooltip);
  };

  const handleTooltipClose = () => {
    setShowTooltip(false);
  };

  // Handle click outside to close tooltip and lock body scroll on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      
      // Lock body scroll on mobile when tooltip is open
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      
      // Restore body scroll
      if (isMobile) {
        document.body.style.overflow = '';
      }
    };
  }, [showTooltip, isMobile]);
  
  return (
    <div className={`metric-card ${isDanger ? 'danger' : ''}`}>
      <div className="metric-header">
        <h3 className="metric-title">{title}</h3>
        {tooltip && (
          <div className="tooltip-container" ref={tooltipRef}>
            <button 
              className="tooltip-icon" 
              onClick={handleInfoClick}
              aria-label={`More information about ${title}`}
            >
              ⓘ
            </button>
            {showTooltip && !isMobile && (
              <>
                <div className="tooltip-backdrop" onClick={handleTooltipClose} />
                <div className="tooltip-dialog">
                  <div className="tooltip-content">
                    <div className="tooltip-header">
                      <h4>{title}</h4>
                      <button 
                        className="tooltip-close" 
                        onClick={handleTooltipClose}
                        aria-label="Close tooltip"
                        autoFocus
                      >
                        ×
                      </button>
                    </div>
                    <div className="tooltip-body">
                      {tooltip}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
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
      
      {/* Mobile tooltip portal */}
      {showTooltip && isMobile && tooltip && createPortal(
        <>
          <div className="tooltip-backdrop" onClick={handleTooltipClose} />
          <div className="tooltip-dialog" ref={tooltipRef}>
            <div className="tooltip-content">
              <div className="tooltip-header">
                <h4>{title}</h4>
                <button 
                  className="tooltip-close" 
                  onClick={handleTooltipClose}
                  aria-label="Close tooltip"
                  autoFocus
                >
                  ×
                </button>
              </div>
              <div className="tooltip-body">
                {tooltip}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default MetricCard;
