import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Bot } from './models/bot.model';
import { BOT_NAME } from '../app.constants';
import {
  InjectBot,
  Update,
  Ctx,
  Start,
  Help,
  On,
  Hears,
} from 'nestjs-telegraf';
import { Context, Telegraf, Markup } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { UserService } from 'src/user/user.service';
import { hash } from 'bcryptjs';
import { RoleName } from 'src/activity/models/activity.models';
@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot) private botRepo: typeof Bot,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>,
    private readonly userService: UserService,
  ) { }

  async onModuleInit() {
    try {
      await this.bot.telegram.setMyCommands([
        { command: 'start', description: 'Botni boshlash' },
        { command: 'my_tests', description: 'Mening testlarim' },
        { command: 'new_test', description: 'Yangi test yaratish' },
        { command: 'reyting', description: 'Test reytingi' },
        { command: 'help', description: 'Yordam ko‘rsatish' },
      ]);
      // const webhookInfo = await this.bot.telegram.getWebhookInfo();
      // console.log('Webhook Info:', webhookInfo);
      // const webhookUrl = `https://jellyfish-app-9syay.ondigitalocean.app/bot`; // Replace SERVER_URL with your public server URL
      // console.log(`Webhook registered at: ${webhookUrl}`);
      // await this.bot.telegram.setWebhook(webhookUrl);
    } catch (error) {
      console.log(error)
    }
  }

  // Handle incoming updates
  async handleUpdate(update: any): Promise<void> {
    try {
      console.log(update);
      await this.bot.handleUpdate(update);
    } catch (error) {
      console.error('Error handling update:', error);
      throw new Error(`Failed to process update: ${error.message}`);
    }
  }

  commands() {
    return {
      parse_mode: 'HTML',
      ...Markup.keyboard([
        ["Parolni o'zgaritish", "Telefon raqamni o'zgartirish"],
      ])
        .oneTime()
        .resize()
    }
  };

  async start(ctx: Context) {
    try {
      const bot_id = ctx.from.id;
      const user = await this.botRepo.findOne({ where: { bot_id } });
      await ctx.reply(
        'Click the button below to open Mini App:',
        Markup.inlineKeyboard([
          Markup.button.webApp('Open Mini App', 'https://ilmnur.online'),
        ]),
      );
      if (!user) {
        await this.botRepo.create({
          bot_id: bot_id,
          name: ctx.from.first_name,
          surname: ctx.from.last_name,
          username: ctx.from.username,
        });
        await ctx.reply(
          `Iltimos, <b> "Telefon raqamni yuborish"</b> tugmasini bosing!`,
          {
            parse_mode: 'HTML',
            ...Markup.keyboard([
              [Markup.button.contactRequest('Telefon raqamni yuborish')],
            ])
              .oneTime()
              .resize(),
          },
        );
      } else if (!user.dataValues.status) {
        await ctx.reply(
          `Iltimos, <b> "Telefon raqamni yuborish"</b> tugmasini bosing!`,
          {
            parse_mode: 'HTML',
            ...Markup.keyboard([
              [Markup.button.contactRequest('Telefon raqamni yuborish')],
            ])
              .oneTime()
              .resize(),
          },
        );
      } else {
        await this.bot.telegram.sendChatAction(bot_id, 'typing');
        await ctx.reply(
          "Bu bot orqali IlmNur dasturi orqali ro'yhatga o'tilgan",
          {
            parse_mode: 'HTML',
            ...Markup.keyboard([
              ["Parolni o'zgaritish", "Telefon raqamni o'zgartirish"],
            ])
              .oneTime()
              .resize()
          }
        );
      }
    } catch (error) {
      console.log(error)
    }
  }

  async handlePhone(ctx: Context) {
    const bot_id = ctx.from.id;
    const user = await this.botRepo.findOne({ where: { bot_id } });
    await ctx.reply(
      `Iltimos, <b> "Telefon raqamni yuborish"</b> tugmasini bosing!`,
      {
        parse_mode: 'HTML',
        ...Markup.keyboard([
          [Markup.button.contactRequest('Telefon raqamni yuborish')],
        ])
          .oneTime()
          .resize(),
      },
    );
  }

  async handlePassword(ctx: Context) {
    const bot_id = ctx.from.id;
    const user = await this.botRepo.findOne({ where: { bot_id } });
    await ctx.reply("Parolingizni quyidagicha kiriting: 👇👇👇 \n\npass:user123", {
      parse_mode: 'HTML',
      ...Markup.removeKeyboard(),
    });
  }

  async onContact(ctx: Context) {
    if ('contact' in ctx.message) {
      const bot_id = ctx.from.id;
      let is_phone = false;
      const user = await this.botRepo.findOne({ where: { bot_id } });
      if (!user) {
        await ctx.reply(`Iltimos, <b>Start</b> tugmasini bosing!`, {
          parse_mode: 'HTML',
          ...Markup.keyboard([['/start']])
            .oneTime()
            .resize(),
        });
      } else if (ctx.message.contact.user_id != bot_id) {
        await ctx.reply("Iltimos, o'zingizni telefon raqamingizni kiriting!", {
          parse_mode: 'HTML',
          ...Markup.keyboard([
            [Markup.button.contactRequest('Telefon raqamni yuborish')],
          ])
            .oneTime()
            .resize(),
        });
      } else {
        if (user.phone) {
          is_phone = true;
        }
        let phone: string;
        ctx.message.contact.phone_number[0] == '+'
          ? (phone = ctx.message.contact.phone_number)
          : (phone = '+' + ctx.message.contact.phone_number);
        if (user.phone) {
          // await this.userService.updatePhone(user.phone, phone);
        }
        const bot_user = await this.botRepo.update(
          { phone, status: true },
          {
            where: { bot_id },
            returning: true
          },
        );
        if (is_phone) {
          await ctx.reply("Telefon raqamingiz muvaffaqiyatli o'zgartirildi", {
            parse_mode: 'HTML',
            ...Markup.removeKeyboard(),
          });
        } else {
          await ctx.reply("Parolingizni quyidagicha kiriting: 👇👇👇 \n\npass:user123", {
            parse_mode: 'HTML',
            ...Markup.removeKeyboard(),
          });
        }
      }
    }
  }

  async setPassword(@Ctx() ctx: Context) {
    const bot_id = ctx.from.id;
    console.log(ctx);
    const message = ctx.message as Message.TextMessage;
    const password = message.text.split(':')[1]
    const user = await this.botRepo.findOne({ where: { bot_id } });
    let bot_user: any;
    if (!user?.user_id) {
      console.log(user);
      // bot_user = await this.userService.register({ password, role: RoleName.student, name: user.name, surname: user.surname, phone: user.phone });
      console.log(bot_user);
      console.log(bot_user?.data?.user.get('id'));
      await this.botRepo.update({ user_id: bot_user?.data?.user.get('id') }, {
        where: { bot_id: user.bot_id },
        returning: true
      })
      // await ctx.reply("Siz ro'yhatdan muvaffaqiyatli o'tdingiz!")
      const url = `https://www.ilmnur.online/login?token=${bot_user.token}`;
      await ctx.reply(`[IlmNur online saytiga kirish uchun shu yerga bosing](${url})`, { parse_mode: 'MarkdownV2' });
    } else {
      bot_user = await this.userService.updatePassword(password, user.phone);
      await ctx.reply(`Parolingiz muvaffaqiyatli o'zgartirildi`);
    }
    console.log(bot_user);
  }

  async onStop(ctx: Context) { }

  async sendOTP(phone: string, OTP: string): Promise<boolean> {
    const user = await this.botRepo.findOne({ where: { phone } });
    if (!user) return false;
    await this.bot.telegram.sendChatAction(user.bot_id, 'typing');
    await this.bot.telegram.sendMessage(user.bot_id, 'Verify code:' + OTP);
    return true;
  }
}
