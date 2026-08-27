import { forwardRef, Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Bot } from './models/bot.model';
import { BotChild } from './models/bot_child.model';
import { BotUpdate } from './bot.update';
import { UserModule } from 'src/user/user.module';
// import { WebhookController } from './bot.controller';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { BOT_NAME } from 'src/app.constants';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { CourseModule } from 'src/course/course.module';
import { LessonModule } from 'src/lesson/lesson.module';
import { TestsModule } from 'src/test/test.module';
import { ReytingModule } from 'src/reyting/reyting.module';
import { Group } from 'src/group/models/group.models';
import { RoleModule } from 'src/role/role.module';

@Module({
  imports: [SequelizeModule.forFeature([Bot, BotChild, Group]), UserModule, RoleModule, forwardRef(() => SubscriptionsModule), CourseModule, LessonModule, forwardRef(() => TestsModule), forwardRef(() => ReytingModule),
  // TelegrafModule.forRootAsync({
  //   botName: BOT_NAME,
  //   useFactory: async (configService: ConfigService) => ({
  //     token: process.env.BOT_TOKEN,
  //     includes: [BotModule],
  //     launchOptions: {
  //       webhook: {
  //         domain: 'https://vercelbackend-production.up.railway.app',
  //         hookPath: '/api/webhook',
  //       }
  //     }
  //   }),
  //   inject: [ConfigService]
  // }),
  ],
  // controllers: [WebhookController],
  providers: [BotService, BotUpdate],
  exports: [BotService]
})
export class BotModule { }
