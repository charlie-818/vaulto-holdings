# Vaulto.ai Hyperliquid Ethereum Vault Dashboard

A professional, data-centric web dashboard for Vaulto.ai's Hyperliquid Ethereum Vault, providing real-time leverage, exposure, and performance metrics. Built with React, TypeScript, and modern web technologies.

## Features

### Core Metrics
- **ETH Net Exposure**: Real-time leveraged exposure to Ethereum with daily change indicators
- **Total Leverage**: Current leverage ratio with daily and weekly change tracking
- **Liquidation Price**: Risk monitoring with visual danger zone indicators
- **Vault NAV**: Net Asset Value in both USD and ETH with performance tracking
- **Total Vault Value**: Complete portfolio value overview

### Performance Analytics
- **Ethereum Price Performance**: Real-time ETH price chart with historical data from CoinGecko
- **Daily/30-Day Returns**: Short-term performance metrics
- **Real-time ETH Price Feed**: Live price updates with accurate daily change percentages

### Risk Management
- **Volatility Metrics**: 30-day and 1-year volatility tracking
- **VaR (Value at Risk)**: 95% and 99% confidence intervals
- **Open Interest**: Position monitoring
- **Liquidation Risk**: Real-time distance from liquidation price

### Professional Design
- **MicroStrategy-inspired**: Clean, data-forward design aesthetic
- **Responsive Layout**: Optimized for desktop and mobile devices
- **Real-time Updates**: Auto-refreshing data with timestamps
- **Data Source Attribution**: Clear citation of all data sources

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: CSS3 with CSS Custom Properties
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion for smooth interactions
- **Data**: CoinGecko API for real ETH price data with fallback mock data
- **HTTP Client**: Axios for API requests

## API Integration

### CoinGecko Integration
The dashboard now integrates with CoinGecko API to provide:
- **Real-time ETH Price**: Accurate current Ethereum price
- **Daily Change Percentage**: Precise 24-hour price change
- **Historical Price Data**: 365-day price chart for performance visualization
- **Automatic Caching**: 30-second cache to reduce API calls
- **Fallback Data**: Graceful degradation when API is unavailable

### API Endpoints Used
- `GET /simple/price` - Current ETH price and 24h change
- `GET /coins/ethereum/market_chart` - Historical price data

### Rate Limiting & Caching
- 30-second cache duration for price data
- 30-second cache duration for historical data
- Automatic fallback to mock data on API failure
- User-Agent headers for proper API identification

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vaulto-holdings
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view the dashboard

### Building for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx   # Main dashboard component with real-time data
│   ├── Header.tsx      # Navigation header
│   ├── ETHTicker.tsx   # ETH price ticker
│   ├── MetricCard.tsx  # Reusable metric display
│   ├── PerformanceChart.tsx # Ethereum price performance visualization
│   └── Footer.tsx      # Footer with data sources
├── services/           # API services
│   └── api.ts         # CoinGecko API integration and caching
├── types/              # TypeScript type definitions
├── data/               # Mock data and fallback utilities
└── index.css           # Global styles
```

## Data Sources

The dashboard integrates with:
- **CoinGecko**: Primary source for ETH price data and historical charts
- **Hyperliquid**: Vault data and positions (planned integration)
- **Chainlink**: Price feeds and oracles (planned integration)

## Customization

### Adding New Metrics
1. Define types in `src/types/index.ts`
2. Add mock data in `src/data/mockData.ts`
3. Create new components or extend existing ones
4. Update the dashboard layout

### Styling
- CSS Custom Properties are defined in `src/index.css`
- Component-specific styles are co-located with components
- Responsive design uses CSS Grid and Flexbox

### Real Data Integration
The dashboard now uses real ETH price data from CoinGecko:
- Automatic price updates every 30 seconds
- Historical data for performance charts
- Graceful fallback to mock data on API failure
- Built-in caching to optimize API usage

## Performance Considerations

- **API Caching**: 30-second cache reduces API calls
- **Lazy Loading**: Components load on demand
- **Memoization**: React.memo for expensive calculations
- **Efficient Re-renders**: Optimized state management
- **CSS Optimization**: Minimal CSS with efficient selectors
- **Error Handling**: Graceful degradation on API failures

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software for Vaulto.ai.

## Support

For questions or support, contact the Vaulto.ai team.
