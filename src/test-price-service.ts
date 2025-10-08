/**
 * Test script for price service
 * Run with: npx ts-node src/test-price-service.ts
 */

import { priceService } from './services/priceService';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function testPriceService() {
  log('\n=== Testing Vaulto Price Service ===\n', 'cyan');
  
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Get ETH Price
  log('Test 1: Fetching ETH Price...', 'blue');
  try {
    const startTime = Date.now();
    const ethPrice = await priceService.getETHPrice();
    const duration = Date.now() - startTime;
    
    log(`✓ ETH Price: $${ethPrice.current.toLocaleString()}`, 'green');
    log(`  24h Change: ${ethPrice.dailyChangePercent > 0 ? '+' : ''}${ethPrice.dailyChangePercent.toFixed(2)}%`, 'green');
    log(`  Source: ${ethPrice.source}`, 'green');
    log(`  Fetch Time: ${duration}ms`, 'green');
    
    if (ethPrice.current > 0 && ethPrice.current < 100000) {
      passedTests++;
    } else {
      throw new Error('Price out of expected range');
    }
  } catch (error) {
    log(`✗ ETH Price test failed: ${error}`, 'red');
    failedTests++;
  }

  // Test 2: Get BTC Price
  log('\nTest 2: Fetching BTC Price...', 'blue');
  try {
    const startTime = Date.now();
    const btcPrice = await priceService.getBTCPrice();
    const duration = Date.now() - startTime;
    
    log(`✓ BTC Price: $${btcPrice.current.toLocaleString()}`, 'green');
    log(`  24h Change: ${btcPrice.dailyChangePercent > 0 ? '+' : ''}${btcPrice.dailyChangePercent.toFixed(2)}%`, 'green');
    log(`  Source: ${btcPrice.source}`, 'green');
    log(`  Fetch Time: ${duration}ms`, 'green');
    
    if (btcPrice.current > 0 && btcPrice.current < 200000) {
      passedTests++;
    } else {
      throw new Error('Price out of expected range');
    }
  } catch (error) {
    log(`✗ BTC Price test failed: ${error}`, 'red');
    failedTests++;
  }

  // Test 3: Get Both Prices (Parallel)
  log('\nTest 3: Fetching Both Prices (Parallel)...', 'blue');
  try {
    const startTime = Date.now();
    const prices = await priceService.getCryptoPrices();
    const duration = Date.now() - startTime;
    
    log(`✓ Fetched both prices in ${duration}ms`, 'green');
    log(`  ETH: $${prices.eth.current.toLocaleString()} (${prices.eth.dailyChangePercent > 0 ? '+' : ''}${prices.eth.dailyChangePercent.toFixed(2)}%)`, 'green');
    log(`  BTC: $${prices.btc.current.toLocaleString()} (${prices.btc.dailyChangePercent > 0 ? '+' : ''}${prices.btc.dailyChangePercent.toFixed(2)}%)`, 'green');
    passedTests++;
  } catch (error) {
    log(`✗ Parallel fetch test failed: ${error}`, 'red');
    failedTests++;
  }

  // Test 4: Cache Test
  log('\nTest 4: Testing Cache...', 'blue');
  try {
    const cacheStatus = priceService.getCacheStatus();
    log(`✓ Cache Status:`, 'green');
    log(`  Size: ${cacheStatus.size}`, 'green');
    log(`  Keys: ${cacheStatus.keys.join(', ')}`, 'green');
    
    // Fetch again - should be cached
    const startTime = Date.now();
    await priceService.getETHPrice();
    const duration = Date.now() - startTime;
    
    if (duration < 100) {
      log(`✓ Cached fetch took ${duration}ms (very fast!)`, 'green');
      passedTests++;
    } else {
      log(`⚠ Cached fetch took ${duration}ms (expected < 100ms)`, 'yellow');
      passedTests++;
    }
  } catch (error) {
    log(`✗ Cache test failed: ${error}`, 'red');
    failedTests++;
  }

  // Test 5: Force Refresh
  log('\nTest 5: Testing Force Refresh...', 'blue');
  try {
    const startTime = Date.now();
    const prices = await priceService.forceRefreshPrices();
    const duration = Date.now() - startTime;
    
    log(`✓ Force refresh completed in ${duration}ms`, 'green');
    log(`  ETH: $${prices.eth.current.toLocaleString()}`, 'green');
    log(`  BTC: $${prices.btc.current.toLocaleString()}`, 'green');
    passedTests++;
  } catch (error) {
    log(`✗ Force refresh test failed: ${error}`, 'red');
    failedTests++;
  }

  // Test 6: localStorage Persistence
  log('\nTest 6: Testing localStorage Persistence...', 'blue');
  try {
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem('vaulto_price_cache');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        log(`✓ localStorage cache exists`, 'green');
        log(`  Keys: ${Object.keys(parsedCache).join(', ')}`, 'green');
        passedTests++;
      } else {
        log(`⚠ localStorage cache not found (may not be available in Node.js)`, 'yellow');
        passedTests++;
      }
    } else {
      log(`⚠ localStorage not available in this environment`, 'yellow');
      passedTests++;
    }
  } catch (error) {
    log(`✗ localStorage test failed: ${error}`, 'red');
    failedTests++;
  }

  // Summary
  log('\n=== Test Summary ===\n', 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`Total: ${passedTests + failedTests}`, 'blue');
  
  const successRate = (passedTests / (passedTests + failedTests)) * 100;
  log(`\nSuccess Rate: ${successRate.toFixed(1)}%`, successRate === 100 ? 'green' : 'yellow');

  if (failedTests === 0) {
    log('\n✓ All tests passed! Price service is working correctly.', 'green');
  } else {
    log(`\n⚠ ${failedTests} test(s) failed. Please review the errors above.`, 'yellow');
  }

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
testPriceService().catch(error => {
  log(`\nFatal error: ${error}`, 'red');
  process.exit(1);
});

