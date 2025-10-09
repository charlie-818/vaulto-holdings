# Netlify Environment Variables Setup Guide

## Critical: Setting Up Environment Variables for Production

This guide ensures the ALP token balance fetching works correctly in production.

## Required Environment Variables

### 1. REACT_APP_ETHERSCAN_API_KEY

**Purpose**: Fetches ALP token balance from BNB Smart Chain via Etherscan API V2

**Steps to set up in Netlify:**

1. Log in to your [Netlify Dashboard](https://app.netlify.com/)
2. Select your site: `vaulto-holdings`
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable** or **Add a single variable**
5. Enter the following:
   - **Key**: `REACT_APP_ETHERSCAN_API_KEY`
   - **Value**: Your Etherscan API key (get from https://etherscan.io/myapikey)
   - **Scopes**: Select all (Production, Deploy Previews, Branch deploys)
6. Click **Create variable**

### 2. ZAPIER_WEBHOOK_URL (Already configured)

**Purpose**: Sends new position notifications to Slack

**Key**: `ZAPIER_WEBHOOK_URL`  
**Value**: Your Zapier webhook URL

## Important Notes

### React Environment Variables
- React requires all environment variables to start with `REACT_APP_` prefix
- These are **build-time** variables, meaning they're baked into the bundle
- You must redeploy after changing environment variables for them to take effect

### After Adding Environment Variables

1. **Trigger a new deploy** in Netlify:
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**
   
2. Or push a new commit to trigger automatic deployment

### Verification

After deployment, check the browser console:
- ✅ Success: You should see "Etherscan API key found, length: XX"
- ❌ Error: If you see "REACT_APP_ETHERSCAN_API_KEY not found", the variable wasn't set correctly

## Security Best Practices

✅ Environment variables are secure in Netlify  
✅ They are not exposed in the client bundle as plain text  
✅ Never commit `.env` file to git (already in `.gitignore`)  
✅ Rotate API keys if ever exposed publicly  

## Troubleshooting

### Issue: "REACT_APP_ETHERSCAN_API_KEY not found"

**Causes:**
1. Environment variable not set in Netlify
2. Typo in the variable name (must be exact: `REACT_APP_ETHERSCAN_API_KEY`)
3. Site wasn't redeployed after adding the variable

**Solution:**
1. Verify the variable exists in Netlify settings
2. Check the exact spelling and case
3. Trigger a new deploy

### Issue: "Etherscan API error"

**Causes:**
1. Invalid or expired API key
2. Rate limit exceeded
3. Wrong chain ID or contract address

**Solution:**
1. Regenerate API key at https://etherscan.io/myapikey
2. Wait a few minutes if rate limited
3. Check the API key has sufficient quota

## API Details

- **Chain**: BNB Smart Chain (BSC)
- **Chain ID**: 56
- **Token Contract**: 0x4E47057f45adF24ba41375a175dA0357cB3480E5
- **Wallet Address**: 0x88902e56e83331379506A4313595f5B9075Ad3e0
- **Cache Duration**: 60 seconds

## Rate Limits

Etherscan Free Tier:
- 5 calls per second
- 100,000 calls per day

With 60-second caching, typical usage is ~1,440 calls/day per active user.

## Support

If you continue to experience issues:
1. Check browser console for detailed error messages
2. Verify environment variable in Netlify dashboard
3. Confirm API key is valid on Etherscan
4. Ensure you've triggered a new deploy after adding variables

