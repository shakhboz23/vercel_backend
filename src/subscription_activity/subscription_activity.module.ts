import { Module, forwardRef } from '@nestjs/common';
import { Subscription_activityService } from './subscription_activity.service';
import { Subscription_activityController } from './subscription_activity.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { RoleModule } from '../role/role.module';
import { MailModule } from '../mail/mail.module';
import { ResetpasswordModule } from '../resetpassword/resetpassword.module';
import { SubscriptionActivity } from './models/subscription_activity.models';

@Module({
  imports: [
    SequelizeModule.forFeature([SubscriptionActivity]),
    forwardRef(() => RoleModule),
    MailModule,
    ResetpasswordModule,
  ],
  controllers: [Subscription_activityController],
  providers: [Subscription_activityService],
  exports: [Subscription_activityService],
})
export class Subscription_activityModule {}
