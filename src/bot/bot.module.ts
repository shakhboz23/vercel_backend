import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Bot } from './models/bot.model';
import { BotUpdate } from './bot.update';
import { UserModule } from 'src/user/user.module';
// import { WebhookController } from './bot.controller';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { BOT_NAME } from 'src/app.constants';

@Module({
  imports: [SequelizeModule.forFeature([Bot]), UserModule,
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
