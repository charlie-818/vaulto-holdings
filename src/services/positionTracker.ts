/**
 * Position Tracker Service
 * Tracks positions from Hyperliquid API and detects new positions
 */

const STORAGE_KEY = 'vaulto_tracked_positions';
const VAULT_ADDRESS = '0xba9e8b2d5941a196288c6e22d1fab9aef6e0497a';

export interface TrackedPosition {
  coin: string;
  size: number;
  entryPrice: number;
  leverage: number;
  timestamp: string;
  hash: string; // Unique identifier for the position
}

export interface PositionNotification {
  asset: string;
  entryPrice: number;
  leverage: number;
  amount: number;
  positionSize: number;
  timestamp: string;
  direction: 'long' | 'short';
  vaultAddress: string;
  unrealizedPnl?: number;
  currentPrice?: number;
  marginUsed?: number;
}

/**
 * Generate a unique hash for a position based on its key characteristics
 */
function generatePositionHash(position: {
  coin: string;
  size: number;
  entryPrice: number;
  leverage: number;
}): string {
  // Create a hash based on coin, size, entry price, and leverage
  // Round values to avoid floating point precision issues
  const normalized = {
    coin: position.coin,
    size: Math.round(position.size * 10000) / 10000,
    entryPrice: Math.round(position.entryPrice * 100) / 100,
    leverage: Math.round(position.leverage * 100) / 100,
  };
  
  return `${normalized.coin}_${normalized.size}_${normalized.entryPrice}_${normalized.leverage}`;
}

/**
 * Load tracked positions from localStorage
 */
function loadTrackedPositions(): TrackedPosition[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading tracked positions:', error);
    return [];
  }
}

/**
 * Save tracked positions to localStorage
 */
function saveTrackedPositions(positions: TrackedPosition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch (error) {
    console.error('Error saving tracked positions:', error);
  }
}

/**
 * Convert dashboard position to tracked position
 */
function toTrackedPosition(position: any): TrackedPosition {
  return {
    coin: position.coin,
    size: position.size,
    entryPrice: position.entryPrice,
    leverage: position.leverage,
    timestamp: new Date().toISOString(),
    hash: generatePositionHash(position),
  };
}

/**
 * Convert position to notification format
 */
function toPositionNotification(position: any): PositionNotification {
  const positionSize = Math.abs(position.size * position.entryPrice);
  const direction = position.size > 0 ? 'long' : 'short';

  return {
    asset: position.coin,
    entryPrice: position.entryPrice,
    leverage: position.leverage,
    amount: Math.abs(position.size),
    positionSize: positionSize,
    timestamp: new Date().toISOString(),
    direction: direction,
    vaultAddress: VAULT_ADDRESS,
    unrealizedPnl: position.unrealizedPnl || 0,
    currentPrice: position.currentPrice || position.entryPrice,
    marginUsed: position.marginUsed || 0,
  };
}

/**
 * Detect new positions by comparing current positions with tracked positions
 */
export function detectNewPositions(currentPositions: any[]): PositionNotification[] {
  const trackedPositions = loadTrackedPositions();
  const trackedHashes = new Set(trackedPositions.map(p => p.hash));
  
  const newPositions: PositionNotification[] = [];
  const updatedTrackedPositions: TrackedPosition[] = [];

  // Check each current position
  for (const position of currentPositions) {
    const positionHash = generatePositionHash(position);
    
    // If this hash doesn't exist in tracked positions, it's new
    if (!trackedHashes.has(positionHash)) {
      newPositions.push(toPositionNotification(position));
      console.log('New position detected:', position.coin, positionHash);
    }
    
    // Add to updated tracked positions
    updatedTrackedPositions.push(toTrackedPosition(position));
  }

  // Save updated positions
  saveTrackedPositions(updatedTrackedPositions);

  return newPositions;
}

/**
 * Manually track a position (useful for initialization)
 */
export function trackPosition(position: any): void {
  const trackedPositions = loadTrackedPositions();
  const newPosition = toTrackedPosition(position);
  
  // Check if position already exists
  const existingIndex = trackedPositions.findIndex(p => p.hash === newPosition.hash);
  
  if (existingIndex >= 0) {
    // Update existing position
    trackedPositions[existingIndex] = newPosition;
  } else {
    // Add new position
    trackedPositions.push(newPosition);
  }
  
  saveTrackedPositions(trackedPositions);
}

/**
 * Manually track all current positions (useful for initialization)
 */
export function trackAllPositions(positions: any[]): void {
  const trackedPositions = positions.map(toTrackedPosition);
  saveTrackedPositions(trackedPositions);
  console.log(`Tracked ${trackedPositions.length} positions`);
}

/**
 * Clear all tracked positions
 */
export function clearTrackedPositions(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log('Cleared all tracked positions');
}

/**
 * Get all currently tracked positions
 */
export function getTrackedPositions(): TrackedPosition[] {
  return loadTrackedPositions();
}

/**
 * Check if this is the first run (no tracked positions exist)
 */
export function isFirstRun(): boolean {
  const tracked = loadTrackedPositions();
  return tracked.length === 0;
}

