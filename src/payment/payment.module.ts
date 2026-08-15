import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Payment } from './models/payment.models';
import { Course } from 'src/course/models/course.models';
import { ReytingModule } from 'src/reyting/reyting.module';
import { UserStreakModule } from 'src/user_streak/user_streak.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { BotModule } from 'src/bot/bot.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Payment, Course]),
    UserStreakModule,
    SubscriptionsModule,
    BotModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
