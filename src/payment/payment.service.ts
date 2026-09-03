import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Payment, PaymentMethod, PaymentStatus } from './models/payment.models';
import { InjectModel } from '@nestjs/sequelize';
import { PaymentDto } from './dto/payment.dto';
import { Op } from 'sequelize';
import { Role } from '../role/models/role.models';
import { ReytingService } from 'src/reyting/reyting.service';
import { ReytingDto } from 'src/reyting/dto/reyting.dto';
import { UserStreakService } from 'src/user_streak/user_streak.service';
import { Lesson } from 'src/lesson/models/lesson.models';
import { Course } from 'src/course/models/course.models';
import { CourseSchedule } from 'src/course_schedule/models/course_schedule.models';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { BotService } from 'src/bot/bot.service';
import * as dayjs from 'dayjs';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment) private paymentRepository: typeof Payment,
    @InjectModel(Course) private courseRepository: typeof Course,
    private userStreakService: UserStreakService,
    private subscriptionsService: SubscriptionsService,
    private botService: BotService,
  ) {}

  async create(paymentDto: PaymentDto): Promise<object> {
    let data: any;
    try {
      if (!paymentDto.amount || paymentDto.amount <= 0) {
        throw new BadRequestException("To'lov miqdori musbat bo'lishi kerak");
      }

      // The admin pays off whichever Payment row is on screen (a specific
      // month), which isn't necessarily the oldest outstanding one - an
      // overdue student can have several unpaid rows at once, and the row
      // shown for the currently-viewed month is filtered by due_date on the
      // way back out (course.service.ts getById). Matching on payment_id
      // keeps the paid row the same one the admin looked at, so it doesn't
      // silently update a different (invisible) month and leave the visible
      // one still showing as unpaid.
      const payment = paymentDto.payment_id
        ? await this.paymentRepository.findOne({
            where: {
              id: paymentDto.payment_id,
              user_id: paymentDto.user_id,
              course_id: paymentDto.course_id,
              status: { [Op.ne]: PaymentStatus.SUCCESS },
            },
            include: [{ model: Course }],
          })
        : await this.paymentRepository.findOne({
            where: {
              user_id: paymentDto.user_id,
              course_id: paymentDto.course_id,
              status: { [Op.ne]: PaymentStatus.SUCCESS },
            },
            order: [['due_date', 'ASC']],
            include: [{ model: Course }],
          });

      if (!payment && paymentDto.payment_id) {
        throw new NotFoundException('Payment not found');
      }

      if (payment) {
        const monthlyPayment = Number(
          payment.monthly_payment ?? payment.course.price,
        );
        const newAmount =
          Number(payment.amount || 0) + Number(paymentDto.amount);

        if (newAmount > monthlyPayment) {
          throw new BadRequestException("To'lov miqdordan oshiqcha");
        }

        const newDebt = monthlyPayment - newAmount;
        const update = await this.paymentRepository.update(
          {
            amount: newAmount,
            debt: newDebt,
            status:
              newDebt <= 0 ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
            payment_method: PaymentMethod.CASH,
            comment: paymentDto.comment ?? payment.comment,
          },
          {
            where: { id: payment.id },
            returning: true,
          },
        );
        data = update[1][0];

        await this.notifyPaid(
          paymentDto.user_id,
          payment.course?.title || '',
          Number(paymentDto.amount),
          Math.max(newDebt, 0),
        );
      } else {
        const course = await this.courseRepository.findByPk(
          paymentDto.course_id,
        );

        if (!course) {
          throw new NotFoundException('Course not found');
        }

        if (paymentDto.amount > course.price) {
          throw new BadRequestException("To'lov miqdordan oshiqcha");
        }

        const debt = course.price - paymentDto.amount;
        data = await this.paymentRepository.create({
          user_id: paymentDto.user_id,
          course_id: paymentDto.course_id,
          comment: paymentDto.comment,
          amount: paymentDto.amount,
          monthly_payment: course.price,
          debt,
          due_date: dayjs().startOf('day').toDate(),
          status: debt <= 0 ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
          payment_method: PaymentMethod.CASH,
        });

        await this.notifyPaid(
          paymentDto.user_id,
          course.title || '',
          Number(paymentDto.amount),
          Math.max(debt, 0),
        );
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Successfully created!',
        data,
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  // Best-effort: a failed Telegram push shouldn't turn a successfully
  // recorded payment into a 400 for the admin who just took the cash.
  private async notifyPaid(
    user_id: number,
    courseTitle: string,
    amountPaid: number,
    remainingDebt: number,
  ): Promise<void> {
    try {
      await this.botService.notifyPaymentReceived(
        user_id,
        courseTitle,
        amountPaid,
        remainingDebt,
      );
    } catch (error) {
      console.log(error);
    }
  }

  // Runs daily: for every subscription, ensures a Payment row exists for every
  // monthly period that has come due since the student's start_date.
  async generateDuePayments(): Promise<void> {
    const subscriptions = await this.subscriptionsService.getAllForBilling();
    const today = dayjs().startOf('day');

    for (const subscription of subscriptions as any[]) {
      if (!subscription.start_date || !subscription.course) continue;

      let dueDate = dayjs(subscription.start_date)
        .add(1, 'month')
        .startOf('day');

      while (!dueDate.isAfter(today)) {
        await this.paymentRepository.findOrCreate({
          where: {
            user_id: subscription.user_id,
            course_id: subscription.course_id,
            due_date: dueDate.toDate(),
          },
          defaults: {
            user_id: subscription.user_id,
            course_id: subscription.course_id,
            due_date: dueDate.toDate(),
            monthly_payment: subscription.course.price,
            amount: 0,
            debt: subscription.course.price,
            status: PaymentStatus.PENDING,
            payment_method: PaymentMethod.CASH,
          } as any,
        });

        dueDate = dueDate.add(1, 'month');
      }
    }
  }

  // Runs daily: reminds the student and their parent(s) once a day, starting
  // the day a payment becomes due and repeating every day until it's paid.
  async sendPaymentReminders(): Promise<void> {
    const today = dayjs().startOf('day');

    const payments = await this.paymentRepository.findAll({
      where: {
        status: { [Op.ne]: PaymentStatus.SUCCESS },
        due_date: { [Op.lte]: today.toDate() },
        [Op.or]: [
          { last_reminder_at: null },
          { last_reminder_at: { [Op.lt]: today.toDate() } },
        ],
      },
      include: [{ model: Course }],
    });

    for (const payment of payments as any[]) {
      try {
        const remaining = Number(payment.debt ?? payment.monthly_payment ?? 0);
        if (remaining <= 0) continue;
        await this.botService.notifyPaymentDue(
          payment.user_id,
          payment.course?.title || '',
          remaining,
          payment.due_date,
        );
        await payment.update({ last_reminder_at: today.toDate() });
      } catch (error) {
        console.log(error);
      }
    }
  }

  async getAll(): Promise<object> {
    try {
      const users = await this.paymentRepository.findAll();
      return {
        statusCode: HttpStatus.OK,
        data: users,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: string): Promise<object> {
    try {
      const user = await this.paymentRepository.findByPk(id, {
        include: { model: Role },
      });
      if (!user) {
        throw new NotFoundException('User topilmadi!');
      }
      return {
        statusCode: HttpStatus.OK,
        data: user,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number, limit: number): Promise<object> {
    try {
      const offset = (page - 1) * limit;
      const users = await this.paymentRepository.findAll({ offset, limit });
      const total_count = await this.paymentRepository.count();
      const total_pages = Math.ceil(total_count / limit);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: users,
          pagination: {
            currentPage: Number(page),
            total_pages,
            total_count,
          },
        },
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteUser(id: string): Promise<object> {
    try {
      const user = await this.paymentRepository.findByPk(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      user.destroy();
      return {
        statusCode: HttpStatus.ACCEPTED,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
