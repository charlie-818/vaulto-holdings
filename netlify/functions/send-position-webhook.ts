import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface PositionWebhookData {
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

interface WebhookResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
): Promise<{ statusCode: number; body: string; headers: any }> => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed. Use POST.',
      }),
    };
  }

  try {
    // Parse the incoming position data
    const positionData: PositionWebhookData = JSON.parse(event.body || '{}');

    // Validate required fields
    const requiredFields = ['asset', 'entryPrice', 'leverage', 'amount', 'positionSize', 'vaultAddress'];
    const missingFields = requiredFields.filter(field => !(field in positionData));

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
        }),
      };
    }

    // Get Zapier webhook URL from environment variable
    const zapierWebhookUrl = process.env.ZAPIER_WEBHOOK_URL;

    if (!zapierWebhookUrl) {
      console.error('ZAPIER_WEBHOOK_URL environment variable is not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Webhook URL not configured. Please set ZAPIER_WEBHOOK_URL environment variable.',
        }),
      };
    }

    // Format data for Zapier
    const zapierPayload = {
      asset: positionData.asset,
      entryPrice: positionData.entryPrice,
      leverage: positionData.leverage,
      amount: positionData.amount,
      positionSize: positionData.positionSize,
      timestamp: positionData.timestamp || new Date().toISOString(),
      direction: positionData.direction,
      vaultAddress: positionData.vaultAddress,
      unrealizedPnl: positionData.unrealizedPnl || 0,
      currentPrice: positionData.currentPrice || positionData.entryPrice,
      marginUsed: positionData.marginUsed || 0,
      // Add formatted values for better Slack display
      formatted: {
        entryPrice: `$${positionData.entryPrice.toFixed(2)}`,
        leverage: `${positionData.leverage.toFixed(2)}x`,
        amount: `${positionData.amount.toFixed(4)} ${positionData.asset}`,
        positionSize: `$${positionData.positionSize.toFixed(2)}`,
        unrealizedPnl: `$${(positionData.unrealizedPnl || 0).toFixed(2)}`,
        currentPrice: `$${(positionData.currentPrice || positionData.entryPrice).toFixed(2)}`,
      },
    };

    // Send to Zapier webhook
    const zapierResponse = await fetch(zapierWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(zapierPayload),
    });

    if (!zapierResponse.ok) {
      const errorText = await zapierResponse.text();
      console.error('Zapier webhook failed:', zapierResponse.status, errorText);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Failed to send to Zapier webhook',
          error: `Zapier returned ${zapierResponse.status}: ${errorText}`,
        }),
      };
    }

    // Get Zapier response
    let zapierData;
    try {
      zapierData = await zapierResponse.json();
    } catch {
      zapierData = await zapierResponse.text();
    }

    console.log('Successfully sent position to Zapier:', positionData.asset);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Position webhook sent successfully',
        data: {
          position: positionData,
          zapierResponse: zapierData,
        },
      }),
    };
  } catch (error) {
    console.error('Error in webhook handler:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

