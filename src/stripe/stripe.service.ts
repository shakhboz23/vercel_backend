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
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import { Group } from 'src/group/models/group.models';

@Injectable()
export class StripeService {
  constructor(
    @InjectModel(PaymentStripe) private stripeRepository: typeof PaymentStripe,
    private readonly courseService: CourseService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly sequelize: Sequelize,
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
      const payment: any = await this.stripeRepository.findAll({
        where: {
          user_id,
          amount: { [Op.gt]: 0 },
        },
        include: [{ model: Course }],
        order: [['createdAt', 'ASC']],
      });

      // 2. Umumiy to‘lovni olish
      const total = await this.stripeRepository.findOne({
        where: {
          user_id,
          amount: { [Op.gt]: 0 },
        },
        attributes: [
          [
            Sequelize.fn('SUM', Sequelize.col('amount')),
            'total_payment'
          ],
          [
            Sequelize.literal(`
              SUM(CASE 
                WHEN "createdAt" >= DATE_TRUNC('month', NOW()) 
                THEN "amount" 
                ELSE 0 
              END)
            `),
            'total_monthly_payment'
          ],

          // Kurslar soni
          [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('course_id'))), 'purchased_courses_count']
        ],
        raw: true,
      });


      if (!payment.length) {
        throw new NotFoundException('Payment history not found');
      }
      return { payment, total };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getUserGroupPaymentHistory(user_id: number) {
    try {
      const payment: any = await this.stripeRepository.findAll({
        where: {
          amount: { [Op.gt]: 0 },
        },
        include: [{
          model: Course, include: [{
            model: Group, where: { user_id },
            required: true,
          }],
          required: true,
        }],
        order: [['createdAt', 'ASC']],
      });

      // 2. Umumiy to‘lovni olish
      const [total] = await this.sequelize.query(`
          SELECT 
            SUM(s.amount) AS total_payment,
            SUM(CASE 
              WHEN s."createdAt" >= DATE_TRUNC('month', NOW()) THEN s.amount ELSE 0 
            END) AS total_monthly_payment,
            COUNT(DISTINCT s.course_id) AS purchased_courses_count
          FROM "stripe" s
          INNER JOIN "course" c ON c.id = s.course_id
          INNER JOIN "group" g ON g.id = c.group_id
          WHERE s.amount > 0 AND g.user_id = :user_id
        `, {
        replacements: { user_id },
        type: QueryTypes.SELECT,
      });

      if (!payment.length) {
        throw new NotFoundException('Payment history not found');
      }
      return { payment, total };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getGroupPaymentHistory(user_id: number) {
    try {
      const courseBreakdown = await this.stripeRepository.findAll({
        attributes: [
          [Sequelize.col('course.group_id'), 'group_id'],
          [Sequelize.fn('SUM', Sequelize.col('amount')), 'total']
        ],
        include: [{
          model: Course,
          attributes: [],
          include: [{
            model: Group,
            where: { user_id },
            attributes: ['title', 'user_id'], // agar title kerak bo‘lsa: ['title']
            required: true,
          }],
          required: true,
        }],
        group: ['course.group_id', 'course.group.id'],
        raw: true,
      });

      // 1. Umumiy to‘lovni olish
      const [payment] = await this.sequelize.query(`
        SELECT 
          SUM(CASE 
            WHEN sp."createdAt" >= DATE_TRUNC('month', NOW()) 
            THEN sp.amount 
            ELSE 0 
          END) AS total_current_month_payment,
          SUM(CASE
            WHEN sp."createdAt" >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
                AND sp."createdAt" < DATE_TRUNC('month', NOW()) 
            THEN sp.amount 
            ELSE 0 
          END) AS total_previous_month_payment
        FROM "stripe" sp
        JOIN "course" c ON c.id = sp.course_id
        WHERE c.user_id = :userId AND sp.amount > 0
      `, {
        replacements: { userId: user_id },
        type: QueryTypes.SELECT
      });

      // 2. Umumiy likelarni olish
      const [likes] = await this.sequelize.query(`
        SELECT 
          SUM(CASE 
            WHEN l."createdAt" >= DATE_TRUNC('month', NOW()) 
            THEN 1
            ELSE 0 
          END) AS total_current_month_like,
          SUM(CASE
            WHEN l."createdAt" >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
                AND l."createdAt" < DATE_TRUNC('month', NOW()) 
            THEN 1
            ELSE 0 
          END) AS total_previous_month_like
        FROM "likes" l
        JOIN "lesson" lesson ON lesson.id = l.lesson_id
        JOIN "course" c ON c.id = lesson.course_id
        WHERE c.user_id = :userId
      `, {
        replacements: { userId: user_id },
        type: QueryTypes.SELECT
      });

      // 3. Umumiy Watchedlarni olish
      const [watched] = await this.sequelize.query(`
        SELECT 
          SUM(CASE 
            WHEN w."createdAt" >= DATE_TRUNC('month', NOW()) 
            THEN 1
            ELSE 0 
          END) AS total_current_month_watched,
          SUM(CASE
            WHEN w."createdAt" >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
                AND w."createdAt" < DATE_TRUNC('month', NOW()) 
            THEN 1
            ELSE 0 
          END) AS total_previous_month_watched
        FROM "watched" w
        JOIN "lesson" lesson ON lesson.id = w.lesson_id
        JOIN "course" c ON c.id = lesson.course_id
        WHERE c.user_id = :userId
      `, {
        replacements: { userId: user_id },
        type: QueryTypes.SELECT
      });

      // 3. Umumiy Watchedlarni olish
      const [subscribers] = await this.sequelize.query(`
        SELECT 
          SUM(CASE 
            WHEN s."createdAt" >= DATE_TRUNC('month', NOW()) 
            THEN 1
            ELSE 0 
          END) AS total_current_month_subscribers,
          SUM(CASE
            WHEN s."createdAt" >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
                AND s."createdAt" < DATE_TRUNC('month', NOW()) 
            THEN 1
            ELSE 0 
          END) AS total_previous_month_subscribers
        FROM "subscriptions" s
        JOIN "course" c ON c.id = s.course_id
        WHERE c.user_id = :userId
      `, {
        replacements: { userId: user_id },
        type: QueryTypes.SELECT
      });



      if (!payment) {
        throw new NotFoundException('Payment history not found');
      }
      return { ...payment, ...likes, ...watched, ...subscribers, courseBreakdown };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
