import { forwardRef, Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Bot } from './models/bot.model';
import { BotChild } from './models/bot_child.model';
import { BotUpdate } from './bot.update';
import { UserModule } from 'src/user/user.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { CourseModule } from 'src/course/course.module';
import { LessonModule } from 'src/lesson/lesson.module';
import { TestsModule } from 'src/test/test.module';
import { ReytingModule } from 'src/reyting/reyting.module';
import { Group } from 'src/group/models/group.models';
import { RoleModule } from 'src/role/role.module';
import { BotOnboardingService } from './services/bot-onboarding.service';
import { BotNotificationsService } from './services/bot-notifications.service';
import { BotDashboardService } from './services/bot-dashboard.service';
import { BotLessonsService } from './services/bot-lessons.service';
import { BotChildrenService } from './services/bot-children.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Bot, BotChild, Group]),
    UserModule,
    RoleModule,
    forwardRef(() => SubscriptionsModule),
    CourseModule,
    forwardRef(() => LessonModule),
    forwardRef(() => TestsModule),
    forwardRef(() => ReytingModule),
  ],
  providers: [
    BotService,
    BotUpdate,
    BotOnboardingService,
    BotNotificationsService,
    BotDashboardService,
    BotLessonsService,
    BotChildrenService,
  ],
  exports: [BotService],
})
export class BotModule {}
