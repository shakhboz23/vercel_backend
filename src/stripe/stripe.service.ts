// stripe/stripe.service.ts
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeDto } from './dto/stripe.dto';

@Injectable()
export class StripeService {
  private stripe = new Stripe(process.env.STRIPE_API_KEY, {
    // apiVersion: '2023-10-16',
  });

  async createCheckoutSession(stripeDto: StripeDto) {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Course #${stripeDto.course_id}`,
            },
            unit_amount: stripeDto.amount * 100, // dollar to cent
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `https://yourdomain.com/payment-success?courseId=${stripeDto.course_id}`,
      cancel_url: `https://yourdomain.com/payment-cancel`,
    });

    return { url: session.url };
  }
}
