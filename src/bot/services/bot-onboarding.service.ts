import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Bot } from '../models/bot.model';
import { BOT_NAME } from '../../app.constants';
import { Ctx, InjectBot } from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { UserService } from 'src/user/user.service';
import { RoleName } from 'src/activity/models/activity.models';
import { RoleService } from 'src/role/role.service';

export const CHILD_ID_STEP = 'child_id';
export const NAME_STEP = 'name';
export const SURNAME_STEP = 'surname';
export const PASSWORD_STEP = 'password';
export const TASK_STEP = 'task';

// Handles the registration / role-selection wizard a user goes through the
// first time they open the bot (pick role -> share phone -> name -> surname
// -> password), plus profile-field edits reachable later ("Parolni
// o'zgaritish" / "Telefon raqamni o'zgartirish"). Extracted out of
// BotService, which keeps thin delegating wrappers.
@Injectable()
export class BotOnboardingService {
  constructor(
    @InjectModel(Bot) private botRepo: typeof Bot,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  mainMenuButtons(role: string): string[][] {
    if (role === 'parent') {
      return [['Farzandlarim'], ['Profil']];
    }

    return [['Statistika', 'Kurslar'], ['Reyting', 'Davomat'], ['Profil']];
  }

  async start(ctx: Context) {
    try {
      const bot_id = ctx.from.id;
      const botUser = await this.botRepo.findOne({ where: { bot_id } });

      if (!botUser) {
        await this.botRepo.create({
          bot_id: bot_id,
          username: ctx.from.username,
        });
      }

      return this.askRole(ctx);
    } catch (error) {
      console.log(error);
    }
  }

  async askRole(ctx: Context) {
    await ctx.reply('Siz kimsiz?', {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('👨‍👩‍👦 Ota-ona', 'role_parent')],
        [Markup.button.callback("🎓 O'quvchi", 'role_student')],
      ]),
    });
  }

  async setRole(ctx: Context, role: 'parent' | 'student') {
    const bot_id = ctx.from.id;
    await this.botRepo.update({ role }, { where: { bot_id } });

    const botUser = await this.botRepo.findOne({ where: { bot_id } });
    if (botUser?.user_id) {
      await this.ensureUserRole(botUser.user_id, role);
    }

    return this.continueAfterRole(ctx);
  }

  // Creates the Role record for the picked role if the user doesn't already
  // have it; if it exists, does nothing so the flow just continues.
  private async ensureUserRole(user_id: number, role: string): Promise<void> {
    try {
      const existing: any = await this.roleService.getUserRoles(user_id, role);
      if (!existing?.data?.length) {
        await this.roleService.create({ user_id, role });
      }
    } catch (error) {
      console.log(error);
    }
  }

  async continueAfterRole(ctx: Context) {
    try {
      const bot_id = ctx.from.id;
      const botUser = await this.botRepo.findOne({ where: { bot_id } });
      let user;
      try {
        user = await this.userService.getById(botUser?.user_id);
      } catch (error) {}

      if (!botUser.dataValues.status) {
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
        if (!user?.name) {
          return this.askName(ctx);
        } else if (!user?.surname) {
          return this.askSurname(ctx);
        } else if (!user && botUser.dataValues.status) {
          return this.handlePassword(ctx);
        }
        await this.bot.telegram.sendChatAction(bot_id, 'typing');

        await ctx.reply('Academic Success Hub ga xush kelibsiz', {
          parse_mode: 'HTML',
          ...Markup.keyboard(this.mainMenuButtons(botUser.dataValues.role))
            .oneTime()
            .resize(),
        });

        await ctx.reply(
          'Click the button below to Academic Success Hub:',
          Markup.inlineKeyboard([
            Markup.button.webApp(
              'Academic Success Hub',
              'https://www.ashacademy.uz/',
            ),
          ]),
        );
      }
    } catch (error) {
      console.log(error);
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

  async askName(ctx: Context) {
    const bot_id = ctx.from.id;
    await this.botRepo.update({ step: NAME_STEP }, { where: { bot_id } });
    await ctx.reply('Iltimos ismingizni kiriting: 👇', {
      parse_mode: 'HTML',
      ...Markup.removeKeyboard(),
    });
  }

  async askSurname(ctx: Context) {
    const bot_id = ctx.from.id;
    await this.botRepo.update({ step: SURNAME_STEP }, { where: { bot_id } });
    await ctx.reply('Iltimos familiyangizni kiriting: 👇', {
      parse_mode: 'HTML',
      ...Markup.removeKeyboard(),
    });
  }

  async handlePassword(ctx: Context) {
    const bot_id = ctx.from.id;
    await this.botRepo.update({ step: PASSWORD_STEP }, { where: { bot_id } });
    await ctx.reply('Parolingizni kiriting: 👇', {
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
        const bot_user = await this.botRepo.update(
          { phone, status: true },
          {
            where: { bot_id },
            returning: true,
          },
        );
        if (is_phone) {
          await ctx.reply("Telefon raqamingiz muvaffaqiyatli o'zgartirildi", {
            parse_mode: 'HTML',
            ...Markup.removeKeyboard(),
          });
        } else if (!user.name) {
          await this.askName(ctx);
        } else if (!user.surname) {
          await this.askSurname(ctx);
        } else {
          await this.handlePassword(ctx);
        }
      }
    }
  }

  async setPassword(@Ctx() ctx: Context) {
    const bot_id = ctx.from.id;
    const message = ctx.message as Message.TextMessage;
    const password = message.text.trim();
    const user = await this.botRepo.findOne({ where: { bot_id } });
    let bot_user: any;
    if (!user?.user_id) {
      bot_user = await this.userService.register({
        password,
        name: user.name,
        surname: user.surname,
        role: user.role || RoleName.student,
        phone: user.phone,
        is_active: true,
      });
      await this.botRepo.update(
        { user_id: bot_user?.data.get('id'), step: null },
        {
          where: { bot_id: user.bot_id },
          returning: true,
        },
      );
      const url = `https://www.ashacademy.uz/login?token=${bot_user.token}`;
      await ctx.reply("Ro'yxatdan muvaffaqiyatli o'tdingiz!", {
        parse_mode: 'HTML',
        ...Markup.keyboard(this.mainMenuButtons(user.role)).oneTime().resize(),
      });
      await ctx.reply(
        'Academic Success Hub saytiga kirish uchun shu yerga bosing',
        Markup.inlineKeyboard([
          Markup.button.webApp('Academic Success Hub', url),
        ]),
      );
    } else {
      bot_user = await this.userService.updatePassword(password, user.phone);
      await this.botRepo.update({ step: null }, { where: { bot_id } });
      await ctx.reply(`Parolingiz muvaffaqiyatli o'zgartirildi`);
    }
  }

  async setName(@Ctx() ctx: Context) {
    const bot_id = ctx.from.id;
    const message = ctx.message as Message.TextMessage;
    const name = message.text.trim();

    await this.botRepo.update(
      { name, step: SURNAME_STEP },
      {
        where: { bot_id },
      },
    );
    await ctx.reply('Iltimos familiyangizni kiriting: 👇', {
      parse_mode: 'HTML',
      ...Markup.removeKeyboard(),
    });
  }

  async setSurname(@Ctx() ctx: Context) {
    const bot_id = ctx.from.id;
    const message = ctx.message as Message.TextMessage;
    const surname = message.text.trim();

    await this.botRepo.update(
      { surname },
      {
        where: { bot_id },
      },
    );
    return this.handlePassword(ctx);
  }

  async onStop(ctx: Context) {}

  async sendOTP(phone: string, OTP: string): Promise<boolean> {
    const user = await this.botRepo.findOne({ where: { phone } });
    if (!user) return false;
    await this.bot.telegram.sendChatAction(user.bot_id, 'typing');
    await this.bot.telegram.sendMessage(user.bot_id, 'Verify code:' + OTP);
    return true;
  }
}
