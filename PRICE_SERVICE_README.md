# New Price Service System

## Overview

This document describes the completely new and reliable price fetching system for ETH and BTC prices with 24hr percentage changes.

## Key Features

✅ **Reliable Price Fetching**
- Primary source: CoinGecko API (direct fetch, no CORS proxies)
- Fallback source: Yahoo Finance API
- Automatic retry mechanism with exponential backoff
- Comprehensive error handling

✅ **Fast Page Loading**
- Pre-initialized price service on app load
- Efficient caching with TTL (30 seconds)
- Parallel price fetching for ETH and BTC
- Cached prices available immediately on subsequent requests

✅ **Accurate Data**
- 24hr percentage change directly from API sources
- Real-time price updates every 30 seconds
- Data validation to prevent incorrect prices
- Automatic fallback to sensible defaults if all sources fail

✅ **Clean Architecture**
- Separation of concerns (service, hooks, components)
- React hooks for easy integration
- TypeScript for type safety
- Minimal dependencies

## Architecture

### 1. Price Service (`src/services/priceService.ts`)

The core service that handles all price fetching logic:

```typescript
import { priceService } from './services/priceService';

// Get ETH price
const ethPrice = await priceService.getETHPrice();

// Get BTC price
const btcPrice = await priceService.getBTCPrice();

// Get both prices efficiently
const { eth, btc } = await priceService.getCryptoPrices();

// Force refresh (bypass cache)
const prices = await priceService.forceRefreshPrices();
```

**Features:**
- Automatic caching with 30-second TTL
- Primary source: CoinGecko API
- Fallback source: Yahoo Finance API
- Retry mechanism with exponential backoff
- Data validation for price sanity checks
- Singleton pattern for consistent state

### 2. React Hooks (`src/hooks/useCryptoPrices.ts`)

Easy-to-use React hooks for components:

```typescript
import { useCryptoPrices } from './hooks/useCryptoPrices';

function MyComponent() {
  const { 
    ethPrice, 
    btcPrice, 
    isLoading, 
    error, 
    refreshPrices,
    forceRefresh 
  } = useCryptoPrices({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    enableErrorRetry: true
  });
  
  // Use the prices in your component
  return (
    <div>
      <p>ETH: ${ethPrice?.current}</p>
      <p>BTC: ${btcPrice?.current}</p>
    </div>
  );
}
```

**Available Hooks:**
- `useCryptoPrices()` - Get both ETH and BTC prices
- `useETHPrice()` - Get just ETH price
- `useBTCPrice()` - Get just BTC price

**Hook Options:**
- `autoRefresh` - Enable automatic price refresh (default: true)
- `refreshInterval` - Refresh interval in milliseconds (default: 30000)
- `enableErrorRetry` - Retry on error (default: true)
- `onError` - Error callback function

### 3. Component Integration

The system is fully integrated into existing components:

**Dashboard Component:**
- Uses `useCryptoPrices` hook for automatic price updates
- Displays ETH and BTC prices in hero section
- Shows loading states and error handling
- Auto-refreshes every 30 seconds

**ETHTicker Component:**
- Uses `useETHPrice` hook
- Self-contained with loading and error states
- No props needed - fully autonomous

## Data Flow

```
App Start
  ↓
Pre-initialize Price Service (index.tsx)
  ↓
Fetch Prices in Background
  ↓
Component Mounts
  ↓
useCryptoPrices Hook
  ↓
Check Cache (30s TTL)
  ├─ Cache Hit → Return Cached Prices (instant)
  └─ Cache Miss → Fetch from API
      ├─ Try CoinGecko (primary)
      │   ├─ Success → Cache & Return
      │   └─ Fail → Try Yahoo Finance (fallback)
      │       ├─ Success → Cache & Return
      │       └─ Fail → Return Fallback Defaults
      └─ Auto Retry on Error (with exponential backoff)
  ↓
Auto Refresh Every 30 Seconds
```

## Performance Optimizations

1. **Pre-initialization**: Prices are fetched in background during app initialization
2. **Aggressive Caching**: 30-second cache prevents redundant API calls
3. **Parallel Fetching**: ETH and BTC prices fetched simultaneously
4. **Singleton Service**: Single instance across the app
5. **Lazy Initialization**: Service initializes only when first used
6. **Smart Retry Logic**: Exponential backoff prevents API rate limiting

## Error Handling

The system has multiple layers of error handling:

1. **Primary Source Failure**: Automatically switches to fallback source (Yahoo Finance)
2. **All Sources Fail**: Returns sensible default prices (ETH: $2450, BTC: $112000)
3. **Validation Errors**: Rejects unrealistic prices (sanity checks)
4. **Network Errors**: Automatic retry with exponential backoff
5. **Component Level**: Shows error states in UI with retry options

## Price Sources

### Primary: CoinGecko API
- Endpoint: `https://api.coingecko.com/api/v3/simple/price`
- Direct fetch (no CORS proxies)
- Provides current price and 24hr change
- Rate limit: 50 calls/minute (free tier)

### Fallback: Yahoo Finance API
- Endpoint: `https://query1.finance.yahoo.com/v8/finance/chart/`
- No API key required
- Provides OHLC data and daily changes
- Higher rate limits

## Configuration

Default configuration in `priceService.ts`:

```typescript
const DEFAULT_CONFIG = {
  cacheTimeout: 30000,      // 30 seconds
  retryAttempts: 2,         // 2 retries
  retryDelay: 1000,         // 1 second base delay
  fallbackPrices: {
    ETH: { current: 2450, ... },
    BTC: { current: 112000, ... }
  }
};
```

You can customize the configuration when creating a new service instance:

```typescript
const customService = new PriceService({
  cacheTimeout: 60000,  // 1 minute cache
  retryAttempts: 3,     // 3 retries
  retryDelay: 2000      // 2 second base delay
});
```

## Testing

The price service includes built-in debugging tools:

```javascript
// In browser console:

// Get cache status
priceService.getCacheStatus()

// Force refresh prices
await priceService.forceRefreshPrices()

// Clear cache
priceService.clearCache()
```

## Migration from Old System

The old system used:
- Complex CORS proxy chains
- Multiple unreliable fallback mechanisms
- Inconsistent caching strategies
- Heavy axios dependencies

The new system provides:
- Direct API calls (faster, more reliable)
- Clean fallback hierarchy
- Consistent caching with TTL
- Native fetch API (lighter)
- Better TypeScript support

## Benefits

1. **Reliability**: Multiple fallback sources ensure prices are always available
2. **Performance**: Pre-initialization and caching provide instant price display
3. **Accuracy**: Direct API calls with 24hr change percentages
4. **Maintainability**: Clean, modular architecture
5. **User Experience**: Fast page loads, smooth updates, clear error states

## Troubleshooting

### Prices not updating
- Check network connection
- Verify CoinGecko API is accessible
- Check browser console for errors
- Try force refresh: `priceService.forceRefreshPrices()`

### Incorrect prices displayed
- Prices are validated against sanity checks
- Check if fallback prices are being used
- Verify API sources are returning correct data

### Slow page loading
- Price service pre-initializes on app load
- First load may be slower, subsequent loads are instant
- Check network speed and API response times

## Future Enhancements

Possible improvements:
- Add more fallback sources (Binance, Kraken APIs)
- Implement WebSocket for real-time updates
- Add price history tracking
- Implement adaptive caching based on volatility
- Add price alerts and notifications
- Support for more cryptocurrencies

## Support

For issues or questions:
1. Check browser console for detailed error messages
2. Review this documentation
3. Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: October 8, 2025  
**Author**: Vaulto Holdings Development Team

