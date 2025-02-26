import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Bot } from './models/bot.model';
import { BotUpdate } from './bot.update';
import { UserModule } from 'src/user/user.module';
import { WebhookController } from './bot.controller';

@Module({
  imports: [SequelizeModule.forFeature([Bot]), UserModule],
  controllers: [WebhookController],
  providers: [BotService, BotUpdate],
  exports: [BotService]
})
export class BotModule { }
