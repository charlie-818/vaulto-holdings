# Vaulto Holdings

Professional Ethereum vault management dashboard with real-time CoinGecko integration. Part of VaultoAI's product suite.

## Overview

Vaulto Holdings is a data-centric web dashboard for the Vaulto Ethereum Vault. It displays real-time leverage, exposure, liquidation price, vault NAV, performance metrics, risk metrics (volatility, VaR, liquidation risk), and an Ethereum price chart with historical data. Data is sourced from CoinGecko with fallback to mock data. The design is institutional-grade and responsive. It is maintained by VaultoAI and available at [vaulto-holdings.netlify.app](https://vaulto-holdings.netlify.app).

## Features

- **Core metrics** — ETH net exposure, total leverage, liquidation price, vault NAV, total vault value with daily change indicators
- **Performance** — Real-time ETH price chart (CoinGecko), daily and 30-day returns
- **Risk** — 30-day and 1-year volatility, VaR (95% and 99%), open interest, distance to liquidation
- **UX** — Responsive layout, auto-refresh, data source attribution, optional contact form

## Technology Stack

- **Languages:** TypeScript
- **Frameworks / libraries:** React 18, React Router, React Scripts, Recharts, Framer Motion, Axios, Netlify Functions
- **Data:** CoinGecko API (price and market_chart); proxy to Hyperliquid where configured

## Getting Started

### Prerequisites

- Node.js 16+ and npm (or yarn)

### Installation

```bash
npm install
```

### Running

```bash
npm start
```

Open http://localhost:3000. For production build: `npm run build`; output is in `build/`. Netlify: connect repo, build command `npm run build`, publish directory `build`, Node 18.

## Configuration

No required environment variables for basic run. Configure proxy (e.g. to api.hyperliquid.xyz) or API keys if needed for your deployment.

## Project Structure

- `src/components/` — Dashboard, Header, ETHTicker, MetricCard, PerformanceChart, Contact, Footer
- `src/services/` — API layer (CoinGecko, caching)
- `src/types/` — TypeScript types
- `src/data/` — Mock data and fallbacks

## Contributing

See CONTRIBUTING.md for guidelines, or contact VaultoAI engineering.

## License

Proprietary to Vaulto Holdings / VaultoAI. See repository or organization for terms.

## Contact

VaultoAI Engineering. For support or questions, see the repository or organization documentation.
