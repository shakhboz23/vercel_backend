import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Payment } from './models/payment.models';
import { ReytingModule } from 'src/reyting/reyting.module';
import { UserStreakModule } from 'src/user_streak/user_streak.module';

@Module({
  imports: [SequelizeModule.forFeature([Payment]), UserStreakModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
