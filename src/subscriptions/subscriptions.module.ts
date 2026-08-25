import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Subscriptions } from './models/subscriptions.models';
import { UserModule } from '../user/user.module';
import { UploadedModule } from '../uploaded/uploaded.module';
import { Course } from '../course/models/course.models';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Subscriptions, Course]),
    UserModule,
    UploadedModule,
    forwardRef(() => BotModule),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
