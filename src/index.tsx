import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { priceService } from './services/priceService';

// Pre-initialize price service for fast page loads
// This starts fetching prices in the background before components mount
console.log('🚀 Pre-initializing price service for fast page loads...');
priceService.getCryptoPrices().then(prices => {
  console.log('✅ Price service pre-initialized:', {
    ETH: `$${prices.eth.current}`,
    BTC: `$${prices.btc.current}`
  });
}).catch(error => {
  console.warn('⚠️ Price service pre-initialization failed:', error);
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
