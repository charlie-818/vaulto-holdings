import React, { useState, useEffect } from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  showProgress = false, 
  progress = 0,
  size = 'medium' 
}) => {
  const [dots, setDots] = useState('');

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`loading-spinner-container ${size}`}>
      <div className="loading-wheel"></div>
      
      {message && (
        <div className="loading-message">
          {message}{dots}
        </div>
      )}
      
      {showProgress && (
        <div className="loading-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
          <div className="progress-text">{Math.round(progress)}%</div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
