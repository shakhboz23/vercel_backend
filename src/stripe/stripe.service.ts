// stripe/stripe.service.ts
import { BadRequestException, Injectable, RawBodyRequest } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeDto } from './dto/stripe.dto';
import { Request } from 'express';
import { InjectModel } from '@nestjs/sequelize';
import { PaymentStatus, StripePay } from './models/stripe.models';
import { CourseService } from 'src/course/course.service';

@Injectable()
export class StripeService {
  constructor(
    @InjectModel(StripePay) private stripeRepository: typeof StripePay,
    private readonly courseService: CourseService,
    // private readonly jwtService: JwtService,
  ) { }

  private stripe = new Stripe(process.env.STRIPE_API_KEY, {
    // apiVersion: '2023-10-16',
  });
  private endpointSecret = process.env.STRIPE_SIGNING_SECRET;

  async createCheckoutSession(user_id: number, stripeDto: StripeDto) {
    const course: any = await this.courseService.getById(stripeDto.course_id, user_id);
    let session: any = { id: "" };
    if (course.price) {
      session = await this.stripe.checkout.sessions.create({
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
        success_url: `https://ilmnur.online/course/${stripeDto.course_id}`,
        cancel_url: `https://ilmnur.online/course/${stripeDto.course_id}`,
      });
    }

    await this.stripeRepository.create({
      user_id, ...stripeDto, status: course.price ? PaymentStatus.pending : PaymentStatus.completed, stripe_id: session.id,
    });
    if (course.price) {
      return { url: session.url };
    } else {
      return {
        message: "Successfully joined!",
      }
    }
  }

  async handleStripeWebhook(req: RawBodyRequest<Request>) {
    try {
      // const payload = req.body.toString('utf-8');
      const payload = req.rawBody;
      const signature = req.header('stripe-signature');
      // return req.rawBody;

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
          data = `✅ Payment success: ${session.id}`; // ✅ Now it's a plain string
          const stripeData = await this.stripeRepository.findOne({
            where: { stripe_id: session.id }
          });

          if (stripeData) {
            await this.stripeRepository.update(
              { ...stripeData, status: PaymentStatus.completed },
              { where: { stripe_id: session.id }, returning: true },
            );
          }
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
          data = `Unhandled event type ${event.type}`
      }

      return { received: true, data };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
