import axios from 'axios';

// Etherscan API V2 base URL
const ETHERSCAN_API_BASE = 'https://api.etherscan.io/v2/api';

// BSC Chain ID
const BSC_CHAIN_ID = 56;

// ALP Token Details
const ALP_TOKEN_CONTRACT = '0x4E47057f45adF24ba41375a175dA0357cB3480E5';
const ALP_WALLET_ADDRESS = '0x88902e56e83331379506A4313595f5B9075Ad3e0';

// ALP Token Price Constants
const ALP_TOKEN_PRICE_FALLBACK = 798.14; // Hard fallback price when real value cannot be found

// Cache configuration
const CACHE_DURATION = 60000; // 60 seconds
const cache = new Map<string, { data: any; timestamp: number }>();

// Get cached data if still valid
const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// Set cached data
const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

/**
 * Etherscan API service for querying blockchain data
 */
export const etherscanAPI = {
  /**
   * Get ERC-20 token balance for a specific address
   * Uses Etherscan API V2 with multichain support
   * 
   * @param contractAddress - The token contract address
   * @param walletAddress - The wallet address to query
   * @param chainId - The chain ID (56 for BSC)
   * @returns Token balance as a number (converted from wei using token decimals)
   */
  getTokenBalance: async (
    contractAddress: string = ALP_TOKEN_CONTRACT,
    walletAddress: string = ALP_WALLET_ADDRESS,
    chainId: number = BSC_CHAIN_ID
  ): Promise<number> => {
    const cacheKey = `token_balance_${chainId}_${contractAddress}_${walletAddress}`;
    
    // Check cache first
    const cached = getCachedData(cacheKey);
    if (cached !== null) {
      console.log(`Using cached token balance for ${contractAddress}`);
      return cached;
    }

    const apiKey = process.env.REACT_APP_ETHERSCAN_API_KEY;
    
    if (!apiKey) {
      console.error('REACT_APP_ETHERSCAN_API_KEY not found in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
      throw new Error('Etherscan API key not configured. Please set REACT_APP_ETHERSCAN_API_KEY in Netlify environment variables.');
    }
    
    console.log('Etherscan API key found, length:', apiKey.length);

    try {
      console.log(`Fetching token balance from Etherscan API V2 for wallet ${walletAddress} on chain ${chainId}`);
      
      const response = await axios.get(ETHERSCAN_API_BASE, {
        params: {
          chainid: chainId,
          module: 'account',
          action: 'tokenbalance',
          contractaddress: contractAddress,
          address: walletAddress,
          apikey: apiKey
        },
        timeout: 10000 // 10 second timeout
      });

      // Check if the response is successful
      if (response.data.status !== '1') {
        console.error('Etherscan API error:', response.data.message);
        throw new Error(`Etherscan API error: ${response.data.message}`);
      }

      // Get the balance in wei (smallest unit)
      const balanceWei = response.data.result;
      
      // Convert from wei to token units (assuming 18 decimals, which is standard for ERC-20)
      // If ALP uses different decimals, this can be adjusted
      const decimals = 18;
      const balance = parseFloat(balanceWei) / Math.pow(10, decimals);

      console.log(`Token balance fetched successfully: ${balance} ALP`);

      // Cache the result
      setCachedData(cacheKey, balance);

      return balance;
    } catch (error) {
      console.error('Error fetching token balance from Etherscan:', error);
      
      // If it's an axios error, provide more details
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          message: error.message,
          code: error.code,
          response: error.response?.data
        });
      }
      
      throw error;
    }
  },

  /**
   * Get ALP token balance specifically
   * Convenience method for the default ALP token and wallet
   */
  getALPBalance: async (): Promise<number> => {
    return etherscanAPI.getTokenBalance(ALP_TOKEN_CONTRACT, ALP_WALLET_ADDRESS, BSC_CHAIN_ID);
  },

  /**
   * Get ALP token price in USD
   * Since ALP pool token value is unlikely to change frequently,
   * this returns a constant fallback value of 798.14
   * In the future, this could be enhanced to fetch real-time price data
   */
  getALPTokenPrice: async (): Promise<number> => {
    console.log('Fetching ALP token price - using fallback value:', ALP_TOKEN_PRICE_FALLBACK);
    return ALP_TOKEN_PRICE_FALLBACK;
  },

  /**
   * Clear the cache for token balance
   */
  clearCache: () => {
    cache.clear();
    console.log('Etherscan API cache cleared');
  }
};

export default etherscanAPI;

