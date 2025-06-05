// stripe/stripe.service.ts
import { Headers, Injectable, RawBodyRequest, Req, Res } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeDto } from './dto/stripe.dto';
import { Request, Response } from 'express';

@Injectable()
export class StripeService {
  private stripe = new Stripe(process.env.STRIPE_API_KEY, {
    // apiVersion: '2023-10-16',
  });
  private endpointSecret = process.env.STRIPE_SIGNING_SECRET;

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

  async handleStripeWebhook(req: RawBodyRequest<Request>) {
    // return {req: req.body};
    const payload = req.body.toString('utf-8');
    const signature = req.header('stripe-signature');

    // return res.status(200).send(req.body);
    // const buf = req.body as Buffer;
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.endpointSecret,
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return `Webhook Error: ${err.message}`;
    }
    let data: any;
    // Eventga ishlov berish
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('✅ Payment success:', session.id);
        data = '✅ Payment success:', session.id
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
        data = `Unhandled event type ${event.type}`
    }

    return { received: true, data };
  }
}
