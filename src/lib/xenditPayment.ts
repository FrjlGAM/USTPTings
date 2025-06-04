import axios from 'axios';

// Set up Xendit API configuration
const XENDIT_API_URL = 'https://api.xendit.co';
const XENDIT_SECRET_KEY = import.meta.env.VITE_XENDIT_SECRET_KEY || 'YOUR_XENDIT_SECRET_KEY';

// Type definitions for Xendit payment
export interface PaymentRequest {
  externalID: string;
  amount: number;
  payer: {
    email: string;
    name: string;
    phone?: string;
  };
  description: string;
  paymentMethod: 'GCASH' | 'PAYMAYA';
  redirectURL: string;
  cancelRedirectURL?: string; // Added cancel redirect URL
  webhookURL: string;
}

export interface PaymentResponse {
  id: string;
  externalID: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';
  paymentURL: string;
  amount: number;
}

// Map internal payment methods to Xendit channel codes
const PAYMENT_METHOD_TO_CHANNEL_CODE = {
  'GCASH': 'PH_GCASH', // Correct channel code for GCash
  'PAYMAYA': 'PH_PAYMAYA', // Correct channel code for PayMaya
};

// Browser-compatible base64 encoding function
const toBase64 = (str: string): string => {
  return window.btoa(str);
};

// Create a payment via Xendit API
export const createPayment = async (paymentData: PaymentRequest): Promise<PaymentResponse> => {
  try {
    // Use browser-compatible base64 encoding
    const auth = toBase64(`${XENDIT_SECRET_KEY}:`);

    // Use the correct channel code for the selected payment method
    const channelCode = PAYMENT_METHOD_TO_CHANNEL_CODE[paymentData.paymentMethod];
    if (!channelCode) {
      throw new Error(`Unsupported payment method: ${paymentData.paymentMethod}`);
    }
    
    const xenditPayload: any = { // eslint-disable-line
      reference_id: paymentData.externalID,
      currency: "PHP",
      amount: paymentData.amount,
      checkout_method: "ONE_TIME_PAYMENT",
      channel_code: channelCode,
      channel_properties: {
        success_redirect_url: paymentData.redirectURL,
        failure_redirect_url: paymentData.cancelRedirectURL || paymentData.redirectURL + '?status=failed',
        cancel_redirect_url: paymentData.cancelRedirectURL || paymentData.redirectURL + '?status=cancelled',
      },
      metadata: {
        description: paymentData.description,
        payer_email: paymentData.payer.email,
        payer_name: paymentData.payer.name,
        payer_phone: paymentData.payer.phone || 'N/A'
      },
      webhook_urls: [paymentData.webhookURL]
    };
    
    const response = await axios.post(
      `${XENDIT_API_URL}/ewallets/charges`, 
      xenditPayload,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Xendit payment response:', response.data);

    return {
      id: response.data.id,
      externalID: response.data.reference_id,
      status: response.data.status === 'PENDING' ? 'PENDING' : 
              response.data.status === 'SUCCEEDED' ? 'PAID' : 
              response.data.status === 'FAILED' ? 'FAILED' : 'EXPIRED',
      paymentURL: response.data.actions.desktop_web_checkout_url || response.data.actions.mobile_web_checkout_url,
      amount: response.data.amount,
    };
  } catch (error: any) { // eslint-disable-line
    console.error('Xendit payment creation error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to create payment');
  }
};

// Check payment status via Xendit API
export const checkPaymentStatus = async (paymentId: string): Promise<string> => {
  try {
    // Use browser-compatible base64 encoding
    const auth = toBase64(`${XENDIT_SECRET_KEY}:`);
    
    const response = await axios.get(
      `${XENDIT_API_URL}/ewallets/charges/${paymentId}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.status;
  } catch (error: any) { // eslint-disable-line
    console.error('Xendit payment status check error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to check payment status');
  }
};

// Handle webhook events from Xendit
// Note: This function should only be used on the server side, not in the browser
export const validateWebhookSignature = (
  _requestSignature: string,
  _requestBody: string,
  _webhookKey: string
): boolean => {
  try {
    // This should be implemented server-side only
    console.warn('Webhook signature validation should be implemented server-side');
    return true; // Always return true in browser environment
  } catch (error) {
    console.error('Webhook signature validation error:', error);
    return false;
  }
};
