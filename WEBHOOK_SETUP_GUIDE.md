# Webhook Position Notifications Setup Guide

This guide will help you set up automatic Slack notifications for new trading positions via Zapier.

## Overview

The system automatically detects new positions from Hyperliquid API and sends them to Slack via Zapier webhooks. You can also manually send any position to Slack using the "Send to Slack" button on each position card.

## Features

- **Automatic Detection**: New positions are automatically detected when the dashboard refreshes
- **Manual Sending**: Click "Send to Slack" button on any position to manually send it
- **First-Run Safe**: On first load, existing positions are tracked without sending webhooks
- **Rich Data**: Includes entry price, leverage, position size, P&L, and more

## Setup Instructions

### 1. Create Zapier Webhook

1. Go to [Zapier](https://zapier.com) and create a new Zap
2. For the trigger, select **Webhooks by Zapier**
3. Choose **Catch Hook** as the trigger event
4. Copy the webhook URL provided (it will look like: `https://hooks.zapier.com/hooks/catch/123456/abcdef/`)

### 2. Configure Netlify Environment Variable

1. Go to your Netlify dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add a new environment variable:
   - **Key**: `ZAPIER_WEBHOOK_URL`
   - **Value**: Your Zapier webhook URL from step 1
4. Click **Save**
5. Redeploy your site for the changes to take effect

### 3. Test the Webhook

1. Send a test webhook from Zapier or use the "Send to Slack" button on an existing position
2. Zapier will catch the test data
3. Use the test data to set up your Slack message format in the next step

### 4. Configure Slack Integration in Zapier

1. In your Zap, add an action step
2. Select **Slack** as the app
3. Choose **Send Channel Message** as the action event
4. Connect your Slack account
5. Select the channel where you want notifications
6. Format your message using the webhook data fields:

#### Example Slack Message Format:

```
🚨 *New Position Opened*

*Asset*: {{asset}}
*Direction*: {{direction}} ({{leverage}}x leverage)
*Entry Price*: {{formatted__entryPrice}}
*Position Size*: {{formatted__positionSize}}
*Amount*: {{formatted__amount}}

*Current Status*:
Current Price: {{formatted__currentPrice}}
Unrealized P&L: {{formatted__unrealizedPnl}}
Margin Used: ${{marginUsed}}

*Vault*: {{vaultAddress}}
*Timestamp*: {{timestamp}}

View on Hyperliquid: https://app.hyperliquid.xyz/vaults/{{vaultAddress}}
```

### 5. Test End-to-End

1. Click "Send to Slack" on any position in your dashboard
2. Check that the message appears in your Slack channel
3. Verify all data fields are displaying correctly

## Webhook Data Structure

The webhook sends the following data to Zapier:

```json
{
  "asset": "ETH",
  "entryPrice": 2450.50,
  "leverage": 4.5,
  "amount": 10.5,
  "positionSize": 25732.25,
  "timestamp": "2025-10-09T10:30:00Z",
  "direction": "long",
  "vaultAddress": "0xba9e8b2d...",
  "unrealizedPnl": 125.50,
  "currentPrice": 2460.75,
  "marginUsed": 5000.00,
  "formatted": {
    "entryPrice": "$2,450.50",
    "leverage": "4.50x",
    "amount": "10.5000 ETH",
    "positionSize": "$25,732.25",
    "unrealizedPnl": "$125.50",
    "currentPrice": "$2,460.75"
  }
}
```

## How It Works

### Automatic Detection

1. Dashboard fetches positions from Hyperliquid API every 60 seconds
2. Position tracker compares current positions with previously tracked positions
3. New positions are identified by a unique hash (coin + size + entry price + leverage)
4. When a new position is detected, webhook is automatically sent
5. Position is tracked in browser localStorage

### Manual Sending

1. Click "Send to Slack" button on any position card
2. Position data is formatted and sent to the Netlify function
3. Netlify function forwards data to Zapier webhook
4. Success/error message is displayed

## Troubleshooting

### Webhook not sending

1. Check that `ZAPIER_WEBHOOK_URL` is set in Netlify environment variables
2. Verify the webhook URL is correct
3. Check browser console for error messages
4. Redeploy the site after adding environment variables

### Duplicate notifications

- The system tracks positions by a hash of key characteristics
- If position size, entry price, or leverage changes significantly, it may be detected as new
- Clear tracked positions in browser localStorage if needed: `localStorage.removeItem('vaulto_tracked_positions')`

### Slack message not formatting correctly

1. Use the test webhook data in Zapier to see available fields
2. Check that all field names match the data structure above
3. Use the `formatted` object for pre-formatted values

## Advanced Configuration

### Custom Notification Rules

You can modify `/src/services/positionTracker.ts` to customize:
- How positions are identified as "new"
- Which positions should trigger notifications
- Notification frequency limits

### Notification Throttling

To prevent spam, consider adding throttling in the position tracker:
- Rate limit: Only send X notifications per minute
- Position size filter: Only notify for positions above certain size
- Asset filter: Only notify for specific assets

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify Netlify function logs in Netlify dashboard
3. Check Zapier task history for webhook failures
4. Review the webhook data structure to ensure compatibility

## Security Notes

- Never commit the `ZAPIER_WEBHOOK_URL` to version control
- Keep webhook URLs private to prevent unauthorized access
- Consider implementing webhook authentication for production use
- Monitor webhook usage to detect potential abuse

