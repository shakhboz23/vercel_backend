// stripe/stripe.service.ts
import { BadRequestException, Injectable, NotFoundException, RawBodyRequest } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeDto } from './dto/stripe.dto';
import { Request } from 'express';
import { InjectModel } from '@nestjs/sequelize';
import { PaymentStatus, PaymentStripe } from './models/stripe.models';
import { CourseService } from 'src/course/course.service';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { RoleName } from 'src/activity/models/activity.models';
import { Op } from 'sequelize';
import { Course } from 'src/course/models/course.models';
@Injectable()
export class StripeService {
  constructor(
    @InjectModel(PaymentStripe) private stripeRepository: typeof PaymentStripe,
    private readonly courseService: CourseService,
    private readonly subscriptionsService: SubscriptionsService,
    // private readonly jwtService: JwtService,
  ) { }

  private stripe = new Stripe(process.env.STRIPE_API_KEY, {
    // apiVersion: '2023-10-16',
  });
  private endpointSecret = process.env.STRIPE_SIGNING_SECRET;

  async createCheckoutSession(user_id: number, stripeDto: StripeDto) {
    const isPaid = await this.stripeRepository.findOne({
      where: {
        course_id: stripeDto.course_id,
        user_id,
      }
    })

    if (isPaid) {
      throw new BadRequestException("You already subscribed to this course");
    }
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
              unit_amount: course.price * 100, // dollar to cent
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
      user_id, ...stripeDto, amount: course.price, status: course.price ? PaymentStatus.pending : PaymentStatus.completed, stripe_id: session.id,
    });
    await this.subscriptionsService.create({ role: RoleName.student, course_id: stripeDto.course_id }, user_id)

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
              { status: PaymentStatus.completed },
              { where: { stripe_id: session.id }, returning: true },
            );
            await this.subscriptionsService.create({ role: RoleName.student, course_id: stripeData.course_id }, stripeData.user_id)
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


  async getUserPaymentHistory(user_id: number) {
    try {
      const paymentHistory: any = await this.stripeRepository.findAll({
        where: {
          user_id,
          amount: { [Op.gt]: 0 },
        },
        include: [{model: Course}],
        order: [['createdAt', 'ASC']],
      });
      if (!paymentHistory.length) {
        throw new NotFoundException('Payment history not found');
      }
      return paymentHistory;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
