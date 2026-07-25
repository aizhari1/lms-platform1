import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface PaymobAuthResponse {
  token: string;
}

interface PaymobOrderResponse {
  id: number;
}

interface PaymobPaymentKeyResponse {
  token: string;
}

/**
 * PaymobService
 * ---------------------------------------------------------------------
 * Implements Paymob's classic 3-step Accept flow:
 *   1. Authenticate  -> get a short-lived auth token
 *   2. Register Order -> get a Paymob order id
 *   3. Request Payment Key -> get the token used to render the iframe
 * The resulting `paymentKey` is handed to the frontend, which embeds
 * the hosted Paymob iframe using NEXT_PUBLIC_PAYMOB_IFRAME_URL.
 * ---------------------------------------------------------------------
 */
@Injectable()
export class PaymobService {
  private readonly baseUrl = 'https://accept.paymob.com/api';

  constructor(private readonly config: ConfigService) {}

  async createPaymentKey(params: {
    orderId: string;
    amountEgp: number;
    customerEmail: string;
    customerFullName: string;
    customerPhone: string;
  }): Promise<{ paymentKey: string; iframeId: string; checkoutUrl: string }> {
    const authToken = await this.authenticate();
    const paymobOrderId = await this.registerOrder(
      authToken,
      params.amountEgp,
      params.orderId,
    );
    const paymentKey = await this.requestPaymentKey(
      authToken,
      paymobOrderId,
      params,
    );

    const iframeId = this.config.get<string>('PAYMOB_IFRAME_ID') as string;

    // Build the full hosted-iframe URL server-side. Previously only the
    // raw paymentKey/iframeId were returned and the *web* frontend
    // stitched them into a URL using NEXT_PUBLIC_PAYMOB_IFRAME_URL. The
    // Flutter app has no such env var and just needs one ready-to-load
    // URL for its WebView — so build it here once, for every client.
    const checkoutUrl = `${this.baseUrl}/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;

    return { paymentKey, iframeId, checkoutUrl };
  }

  /**
   * Validates the HMAC signature Paymob sends on transaction webhooks
   * to guarantee the callback genuinely originated from Paymob.
   */
  verifyHmac(payload: Record<string, any>, receivedHmac: string): boolean {
    const hmacSecret = this.config.get<string>('PAYMOB_HMAC_SECRET') as string;

    // Paymob requires concatenating specific fields in a fixed order
    const orderedKeys = [
      'amount_cents',
      'created_at',
      'currency',
      'error_occured',
      'has_parent_transaction',
      'id',
      'integration_id',
      'is_3d_secure',
      'is_auth',
      'is_capture',
      'is_refunded',
      'is_standalone_payment',
      'is_voided',
      'order',
      'owner',
      'pending',
      'source_data.pan',
      'source_data.sub_type',
      'source_data.type',
      'success',
    ];

    const concatenated = orderedKeys
      .map((key) => this.getNestedValue(payload, key))
      .join('');

    const computedHmac = crypto
      .createHmac('sha512', hmacSecret)
      .update(concatenated)
      .digest('hex');

    return computedHmac === receivedHmac;
  }

  private getNestedValue(obj: Record<string, any>, path: string): string {
    return path
      .split('.')
      .reduce((acc, key) => (acc ? acc[key] : undefined), obj as any)
      ?.toString() ?? '';
  }

  private async authenticate(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: this.config.get<string>('PAYMOB_API_KEY'),
      }),
    });
    const data = (await response.json()) as PaymobAuthResponse;
    return data.token;
  }

  private async registerOrder(
    authToken: string,
    amountEgp: number,
    merchantOrderId: string,
  ): Promise<number> {
    const response = await fetch(`${this.baseUrl}/ecommerce/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: Math.round(amountEgp * 100),
        currency: 'EGP',
        merchant_order_id: merchantOrderId,
      }),
    });
    const data = (await response.json()) as PaymobOrderResponse;
    return data.id;
  }

  private async requestPaymentKey(
    authToken: string,
    paymobOrderId: number,
    params: {
      amountEgp: number;
      customerEmail: string;
      customerFullName: string;
      customerPhone: string;
    },
  ): Promise<string> {
    const [firstName, ...rest] = params.customerFullName.split(' ');
    const response = await fetch(`${this.baseUrl}/acceptance/payment_keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: Math.round(params.amountEgp * 100),
        expiration: 3600,
        order_id: paymobOrderId,
        billing_data: {
          email: params.customerEmail,
          first_name: firstName || 'N/A',
          last_name: rest.join(' ') || 'N/A',
          phone_number: params.customerPhone || 'NA',
          apartment: 'NA',
          floor: 'NA',
          street: 'NA',
          building: 'NA',
          city: 'NA',
          country: 'EG',
          state: 'NA',
        },
        currency: 'EGP',
        integration_id: this.config.get<string>(
          'PAYMOB_INTEGRATION_ID_ONLINE_CARD',
        ),
      }),
    });
    const data = (await response.json()) as PaymobPaymentKeyResponse;
    return data.token;
  }
}
