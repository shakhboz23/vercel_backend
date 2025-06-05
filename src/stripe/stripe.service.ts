// stripe/stripe.service.ts
import { Headers, Injectable, Req, Res } from '@nestjs/common';
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

  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    const buf = await this.getRawBody(req);

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        buf,
        signature,
        this.endpointSecret,
      );
      console.log(event)
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Event turi bo'yicha ishlov
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;

        console.log('✅ Payment succeeded!');
        console.log('Session ID:', session.id);
        console.log('Email:', session.customer_email);
        console.log('Amount:', session.amount_total);

        // ➕ Bu yerda: kursga yozish, DB ga yozish, email yuborish va hokazo
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.json({ received: true });
  }

  // Raw body olish uchun express body-parser'ni chetlab o'tish
  private getRawBody(req: Request): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      req
        .on('data', (chunk) => chunks.push(chunk))
        .on('end', () => resolve(Buffer.concat(chunks)))
        .on('error', (err) => reject(err));
    });
  }
}
