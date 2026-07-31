import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe | null;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-02-24.acacia',
      });
    } else {
      this.stripe = null;
      this.logger.warn('STRIPE_SECRET_KEY not set — Stripe payments are disabled');
    }
  }

  /**
   * Creates a Stripe Checkout Session for a single course purchase.
   * The `orderId` is embedded in metadata so the webhook handler can
   * mark the correct Order as PAID once payment succeeds.
   */
  async createCheckoutSession(params: {
    orderId: string;
    courseTitle: string;
    amount: number; // in the smallest currency unit (e.g. cents/halalas)
    currency: string;
    customerEmail: string;
  }): Promise<Stripe.Checkout.Session> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY to enable Stripe payments.');
    }
    const clientUrl = this.config.get<string>('app.clientUrl');

    return this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: params.customerEmail,
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: { name: params.courseTitle },
            unit_amount: Math.round(params.amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: params.orderId },
      success_url: `${clientUrl}/checkout/success?order=${params.orderId}`,
      cancel_url: `${clientUrl}/checkout/cancelled?order=${params.orderId}`,
    });
  }

  /**
   * Verifies the webhook signature and parses the raw payload into a
   * typed Stripe.Event. Throws if the signature is invalid — this is
   * critical to prevent forged "payment succeeded" callbacks.
   */
  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY to enable Stripe webhooks.');
    }
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET') as string;
    return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }
}
