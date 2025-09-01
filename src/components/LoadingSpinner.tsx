import React, { useState, useEffect } from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
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
    </div>
  );
};

export default LoadingSpinner;
