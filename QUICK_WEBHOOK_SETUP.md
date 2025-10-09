# Quick Webhook Setup Guide

## 3-Step Setup (5 minutes)

### Step 1: Create Zapier Webhook (2 min)
1. Go to https://zapier.com/app/zaps
2. Click **Create Zap**
3. Search for "Webhooks by Zapier" → Choose **Catch Hook**
4. **Copy the webhook URL** (looks like: `https://hooks.zapier.com/hooks/catch/123456/abcdef/`)

### Step 2: Add to Netlify (1 min)
1. Go to Netlify dashboard → Your site → **Site settings**
2. Navigate to **Environment variables**
3. Click **Add a variable**
   - **Key**: `ZAPIER_WEBHOOK_URL`
   - **Value**: Paste your webhook URL from Step 1
4. Click **Save**
5. **Redeploy your site** (important!)

### Step 3: Configure Slack in Zapier (2 min)
1. Back in Zapier, click **Continue** → Test the webhook using "Send to Slack" button on site
2. Add action: Search for **Slack** → Choose **Send Channel Message**
3. Connect Slack account and choose your channel
4. Use this message format:

```
🚨 *New Position: {{asset}}*

📊 *Position Details*
• Direction: {{direction}} 
• Leverage: {{leverage}}x
• Entry Price: {{formatted__entryPrice}}
• Position Size: {{formatted__positionSize}}
• Amount: {{formatted__amount}}

💰 *Current Status*
• Current Price: {{formatted__currentPrice}}
• Unrealized P&L: {{formatted__unrealizedPnl}}
• Margin Used: ${{marginUsed}}

🔗 View on Hyperliquid: https://app.hyperliquid.xyz/vaults/{{vaultAddress}}

⏰ {{timestamp}}
```

5. Click **Publish** to activate your Zap

## Test It!

1. Go to your site
2. Find any position
3. Click **"Send to Slack"** button
4. Check your Slack channel for the notification

## That's It! 🎉

New positions will now automatically appear in your Slack channel whenever they're detected.

---

**Need help?** See the full guide: `/WEBHOOK_SETUP_GUIDE.md`

