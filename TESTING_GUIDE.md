# Price Service Testing Guide

## Overview
This document provides comprehensive testing procedures for the Vaulto Holdings price service to ensure accurate ETH and BTC price fetching with proper CORS handling and caching.

## Quick Test

### Browser Console Test
1. Open the application in your browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Run the following commands:

```javascript
// Test 1: Check current prices
window.debugVaultoPrices()

// Test 2: Force refresh
await priceService.forceRefreshPrices()

// Test 3: Check cache status
priceService.getCacheStatus()

// Test 4: Clear cache and test again
priceService.clearCache()
await priceService.getCryptoPrices()
```

### Expected Results
- ETH price should be between $500-$10,000
- BTC price should be between $10,000-$150,000
- 24h change percentage should be reasonable (-50% to +50%)
- Prices should load within 2 seconds on first fetch
- Cached prices should load in < 100ms

## Detailed Test Scenarios

### Test 1: First Load (No Cache)
**Purpose**: Verify that prices fetch correctly on first load

**Steps**:
1. Clear browser cache and localStorage
2. Open the application
3. Monitor the network tab and console

**Expected Behavior**:
- Multiple CORS proxy attempts visible in console
- Prices display within 1-3 seconds
- ETH and BTC prices show correct values
- 24h percentage change displays correctly
- localStorage cache is populated

**Success Criteria**:
- ✓ Prices display accurately
- ✓ No CORS errors in console
- ✓ localStorage contains cached prices
- ✓ Load time < 3 seconds

### Test 2: Subsequent Loads (With Cache)
**Purpose**: Verify cache persistence across page reloads

**Steps**:
1. Load the application (Test 1 completed)
2. Refresh the page
3. Monitor load time

**Expected Behavior**:
- Prices display immediately from cache
- Background refresh occurs after initial display
- No visible loading state

**Success Criteria**:
- ✓ Prices visible in < 100ms
- ✓ No flash of "loading" state
- ✓ Cache timestamp is recent

### Test 3: Cache Expiry and Refresh
**Purpose**: Verify automatic cache refresh after TTL expires

**Steps**:
1. Load the application
2. Wait 60+ seconds
3. Observe price updates

**Expected Behavior**:
- Prices refresh automatically after 60 seconds
- No user interaction needed
- Smooth update without flickering

**Success Criteria**:
- ✓ Automatic refresh occurs
- ✓ New prices fetched from API
- ✓ Cache updated with fresh data
- ✓ UI remains stable during update

### Test 4: CORS Proxy Fallback
**Purpose**: Verify fallback mechanism when primary proxy fails

**Steps**:
1. Block allorigins.win in browser (Network tab)
2. Clear cache
3. Load the application

**Expected Behavior**:
- Console shows primary proxy failure
- Automatically tries corsproxy.io
- Falls back to codetabs.com if needed
- Eventually displays prices

**Success Criteria**:
- ✓ Multiple proxy attempts visible
- ✓ Successful fallback to alternative proxy
- ✓ Prices still display correctly
- ✓ No critical errors

### Test 5: Complete API Failure
**Purpose**: Verify fallback to default prices when all sources fail

**Steps**:
1. Block all CORS proxies in browser
2. Block Yahoo Finance API
3. Clear cache
4. Load the application

**Expected Behavior**:
- All proxy attempts fail (visible in console)
- Yahoo Finance fallback also fails
- Default fallback prices displayed
- User sees prices (ETH: $2450, BTC: $62000)

**Success Criteria**:
- ✓ Application doesn't crash
- ✓ Default prices displayed
- ✓ Clear error indication (if any)
- ✓ Graceful degradation

### Test 6: Network Interruption
**Purpose**: Verify behavior during network issues

**Steps**:
1. Load application successfully
2. Simulate offline mode in browser
3. Refresh page

**Expected Behavior**:
- Cached prices display from localStorage
- Error message about network issue (optional)
- Application remains functional

**Success Criteria**:
- ✓ Cached prices display
- ✓ No application crash
- ✓ Graceful error handling

### Test 7: Price Validation
**Purpose**: Verify price validation prevents incorrect data

**Steps**:
1. Check console logs during price fetch
2. Verify validation occurs
3. Confirm only valid prices are cached

**Expected Behavior**:
- Price validation runs on all fetched data
- Invalid prices are rejected
- Only valid prices cached and displayed

**Success Criteria**:
- ✓ Validation checks pass for ETH (500-10000)
- ✓ Validation checks pass for BTC (10000-150000)
- ✓ 24h change validation (< 50%)
- ✓ NaN values rejected

### Test 8: Concurrent Requests
**Purpose**: Verify efficient handling of multiple simultaneous requests

**Steps**:
1. Open application
2. Quickly navigate between pages
3. Monitor network requests

**Expected Behavior**:
- Cache prevents redundant requests
- Parallel requests for ETH and BTC
- Efficient resource usage

**Success Criteria**:
- ✓ No duplicate API calls
- ✓ ETH and BTC fetched in parallel
- ✓ Cache utilized effectively

### Test 9: Mobile Browser
**Purpose**: Verify functionality on mobile devices

**Steps**:
1. Open application on mobile browser
2. Test with Chrome, Safari, Firefox mobile
3. Monitor performance and display

**Expected Behavior**:
- Prices load correctly on mobile
- localStorage works on mobile
- Performance is acceptable

**Success Criteria**:
- ✓ Prices display correctly
- ✓ Load times acceptable
- ✓ No mobile-specific errors

### Test 10: Long Session
**Purpose**: Verify stability over extended use

**Steps**:
1. Keep application open for 30+ minutes
2. Monitor price updates
3. Check memory usage

**Expected Behavior**:
- Automatic price refreshes every 60 seconds
- No memory leaks
- Consistent performance

**Success Criteria**:
- ✓ Regular price updates occur
- ✓ Memory usage stable
- ✓ No degradation in performance

## Automated Testing

### Run Test Script
```bash
# Install dependencies
npm install

# Run price service test
npm run test:prices
```

### Expected Output
```
=== Testing Vaulto Price Service ===

Test 1: Fetching ETH Price...
✓ ETH Price: $2,450.75
  24h Change: +1.88%
  Source: coingecko
  Fetch Time: 1234ms

Test 2: Fetching BTC Price...
✓ BTC Price: $62,500.00
  24h Change: +2.15%
  Source: coingecko
  Fetch Time: 876ms

...

=== Test Summary ===

Passed: 6
Failed: 0
Total: 6

Success Rate: 100.0%

✓ All tests passed! Price service is working correctly.
```

## Performance Benchmarks

### Target Performance Metrics
- **First Load**: < 3 seconds
- **Cached Load**: < 100ms
- **Cache Hit Rate**: > 95% (after first load)
- **API Success Rate**: > 99% (with fallbacks)
- **Memory Usage**: < 10MB for cache
- **Network Bandwidth**: < 50KB per update

### Monitoring
Check these metrics in production:
```javascript
// In browser console
const metrics = {
  cacheStatus: priceService.getCacheStatus(),
  performanceNow: performance.now(),
  networkRequests: performance.getEntriesByType('resource')
};
console.table(metrics);
```

## Troubleshooting

### Issue: Prices Not Updating
**Symptoms**: Stale prices, no updates after 60s
**Diagnosis**:
```javascript
// Check cache status
priceService.getCacheStatus()

// Check last update time
const cached = localStorage.getItem('vaulto_price_cache');
console.log(JSON.parse(cached));
```
**Solution**: 
- Clear cache: `priceService.clearCache()`
- Force refresh: `priceService.forceRefreshPrices()`

### Issue: CORS Errors
**Symptoms**: Console shows CORS policy errors
**Diagnosis**: Check which proxies are failing
**Solution**: 
- Verify proxy availability
- Check browser extensions (ad blockers)
- Try different browser

### Issue: Invalid Prices
**Symptoms**: Extremely high/low prices, NaN values
**Diagnosis**: Check validation logs
**Solution**:
- Price validation should reject invalid data
- Fallback prices should be used
- Report issue if validation is insufficient

### Issue: Slow Performance
**Symptoms**: Long load times, UI freezing
**Diagnosis**: Check network tab and console
**Solution**:
- Clear browser cache
- Check internet connection
- Verify cache is working

## Production Checklist

Before deploying to production:

- [ ] All automated tests pass
- [ ] Manual testing completed for all scenarios
- [ ] CORS proxies are accessible
- [ ] Fallback prices are reasonable
- [ ] Cache TTL is appropriate (60s)
- [ ] Error logging is configured
- [ ] Performance metrics meet targets
- [ ] Mobile testing completed
- [ ] Cross-browser testing completed
- [ ] Security review completed
- [ ] Documentation is up to date

## Continuous Monitoring

### Key Metrics to Monitor
1. **API Success Rate**: Track % of successful price fetches
2. **Cache Hit Rate**: Monitor cache effectiveness
3. **Load Times**: Track page load performance
4. **Error Rate**: Monitor CORS and API failures
5. **User Experience**: Track price display accuracy

### Alerts to Configure
- Alert if API success rate < 95%
- Alert if load times > 5 seconds
- Alert if cache hit rate < 90%
- Alert if error rate > 5%

## Support

For issues or questions:
1. Check browser console for detailed logs
2. Review this testing guide
3. Run automated tests
4. Check network conditions
5. Contact development team

---

**Last Updated**: October 8, 2025
**Version**: 2.0
**Author**: Vaulto Holdings Development Team

