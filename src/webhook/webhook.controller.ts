import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  HttpCode,
  Inject,
  Body,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BotService } from 'src/bot/bot.service';
import Stripe from 'stripe';

@Controller('/webhook')
export class WebhookController {
  private stripe = new Stripe(process.env.STRIPE_API_KEY, {
    // apiVersion: '2023-10-16',
  },
  );

  constructor(
    private readonly botService: BotService,
  ) { }

  private endpointSecret = process.env.STRIPE_SIGNING_SECRET;
  @Post('bot')
  async handleWebhook(@Body() update: any) {
    // console.log('Telegramdan yangi xabar:', req.body);
    await this.botService.handleUpdate(update);
    return { status: 'ok' };
  }

  @Post()
  @HttpCode(200)
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
