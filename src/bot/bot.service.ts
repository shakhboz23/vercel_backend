import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Bot } from './models/bot.model';
import { BotChild } from './models/bot_child.model';
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
import { RoleName } from 'src/activity/models/activity.models';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { CourseService } from 'src/course/course.service';
import { LessonService } from 'src/lesson/lesson.service';
import { TestsService } from 'src/test/test.service';
import { User } from 'src/user/models/user.models';

const CHILD_ID_STEP = 'child_id';

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot) private botRepo: typeof Bot,
    @InjectModel(BotChild) private botChildRepo: typeof BotChild,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>,
    private readonly userService: UserService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly courseService: CourseService,
    private readonly lessonService: LessonService,
    private readonly testsService: TestsService,
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
        ['Farzandlarim'],
        ["Statistika", "Kurslar"],
        ["Reyting", "Davomat"],
        ["Profil"],
        // ["Parolni o'zgaritish", "Telefon raqamni o'zgartirish"],
      ])
        .oneTime()
        .resize()
    }
  };

  async start(ctx: Context) {
    try {
      const bot_id = ctx.from.id;
      const botUser = await this.botRepo.findOne({ where: { bot_id } });
      let user;
      try {
        user = await this.userService.getById(botUser?.user_id);
      } catch (error) {

      }

      if (!botUser) {
        await this.botRepo.create({
          bot_id: bot_id,
          // name: ctx.from.first_name,
          // surname: ctx.from.last_name,
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
      } else if (!botUser.dataValues.status) {
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
          await ctx.reply("Iltimos ismingizni quyidagicha kiriting: 👇👇👇 \n\nism:Eshmat", {
            parse_mode: 'HTML',
            ...Markup.removeKeyboard(),
          });
          return
        } else if (!user?.surname) {
          await ctx.reply("Iltimos familiyangizni quyidagicha kiriting: 👇👇👇 \n\nfamiliya:Toshmatov", {
            parse_mode: 'HTML',
            ...Markup.removeKeyboard(),
          });
          return
        } else if (!user && botUser.dataValues.status) {
          return this.handlePassword(ctx);
        }
        await this.bot.telegram.sendChatAction(bot_id, 'typing');

        await ctx.reply(
          'Academic Success Hub ga xush kelibsiz',
          {
            parse_mode: 'HTML',
            ...Markup.keyboard([
              ['Farzandlarim'],
              ['Statistika', 'Kurslar'],
              ['Reyting', 'Davomat'],
              ["Profil"],
              // ["Parolni o'zgartirish", 'Telefon raqamni o\'zgartirish'],
            ])
              .oneTime()
              .resize(),
          },
        );

        await ctx.reply(
          'Click the button below to Academic Success Hub:',
          Markup.inlineKeyboard([
            Markup.button.webApp(
              'Academic Success Hub',
              'https://ilmnur-front.vercel.app/',
            ),
          ]),
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
        } else if (!user.name) {
          await ctx.reply("Iltimos ismingizni quyidagicha kiriting: 👇👇👇 \n\nism:Eshmat", {
            parse_mode: 'HTML',
            ...Markup.removeKeyboard(),
          });
        } else if (!user.surname) {
          await ctx.reply("Iltimos familiyangizni quyidagicha kiriting: 👇👇👇 \n\nfamiliya:Toshmatov", {
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
      bot_user = await this.userService.register({ password, name: user.name, surname: user.surname, role: RoleName.student, phone: user.phone, is_active: true });
      console.log(bot_user);
      console.log(bot_user?.data.get('id'));
      await this.botRepo.update({ user_id: bot_user?.data.get('id') }, {
        where: { bot_id: user.bot_id },
        returning: true
      })
      // await ctx.reply("Siz ro'yhatdan muvaffaqiyatli o'tdingiz!")
      const url = `https://ilmnur-front.vercel.app/login?token=${bot_user.token}`;
      // await ctx.reply(`[Academic Success Hub saytiga kirish uchun shu yerga bosing](${url})`, { parse_mode: 'MarkdownV2' });
      await ctx.reply(
        'Academic Success Hub saytiga kirish uchun shu yerga bosing',
        Markup.inlineKeyboard([
          Markup.button.webApp('Academic Success Hub', url),
        ]),
      );
    } else {
      bot_user = await this.userService.updatePassword(password, user.phone);
      await ctx.reply(`Parolingiz muvaffaqiyatli o'zgartirildi`);
    }
    console.log(bot_user);
  }

  async setName(@Ctx() ctx: Context) {
    const bot_id = ctx.from.id;
    const message = ctx.message as Message.TextMessage;
    const name = message.text.split(':')[1]

    const user = await this.botRepo.findOne({ where: { bot_id } });
    let bot_user: any;
    bot_user = await this.botRepo.update({ ...user, name }, {
      where: { bot_id },
      returning: true,
    });
    await ctx.reply("Iltimos familiyangizni quyidagicha kiriting: 👇👇👇 \n\nfamiliya:Toshmatov", {
      parse_mode: 'HTML',
      ...Markup.removeKeyboard(),
    });
  }

  async setSurname(@Ctx() ctx: Context) {
    const bot_id = ctx.from.id;
    const message = ctx.message as Message.TextMessage;
    const surname = message.text.split(':')[1]
    const user = await this.botRepo.findOne({ where: { bot_id } });
    let bot_user: any;
    bot_user = await this.botRepo.update({ ...user, surname }, {
      where: { bot_id },
      returning: true,
    });
    return this.handlePassword(ctx);
  }

  async onStop(ctx: Context) { }

  async sendOTP(phone: string, OTP: string): Promise<boolean> {
    const user = await this.botRepo.findOne({ where: { phone } });
    if (!user) return false;
    await this.bot.telegram.sendChatAction(user.bot_id, 'typing');
    await this.bot.telegram.sendMessage(user.bot_id, 'Verify code:' + OTP);
    return true;
  }

  async my_children(ctx: Context) {
    const bot_id = ctx.from.id;

    const botUser = await this.botRepo.findOne({ where: { bot_id } });

    if (!botUser) {
      return this.start(ctx);
    }

    const children = await this.botChildRepo.findAll({
      where: { parent_bot_id: bot_id },
      include: [{ model: User, as: 'student' }],
      order: [['id', 'ASC']],
    });

    if (!children.length) {
      return this.askChildId(ctx);
    }

    const buttons = children.map((child) => {
      const student: any = child.student;
      const name = [student?.name, student?.surname].filter(Boolean).join(' ');

      return [
        {
          text: `${child.student_id}.${name || "Noma'lum"}`,
          callback_data: `child_${child.student_id}`,
        },
      ];
    });

    buttons.push([
      {
        text: "➕ Farzand qo'shish",
        callback_data: 'add_child',
      },
    ]);

    await ctx.reply('👨‍👩‍👦 Farzandlaringiz:', {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  async askChildId(ctx: Context) {
    const bot_id = ctx.from.id;

    await this.botRepo.update(
      { step: CHILD_ID_STEP },
      { where: { bot_id } },
    );

    await ctx.reply(
      "Farzandingizning ID raqamini yuboring: 👇👇👇 \n\nMasalan: 125",
    );
  }

  async saveChild(ctx: Context) {
    const bot_id = ctx.from.id;
    const message = ctx.message as Message.TextMessage;
    const student_id = Number(message.text.trim());

    if (!Number.isInteger(student_id) || student_id <= 0) {
      await ctx.reply(
        "Iltimos, faqat raqamlardan iborat ID yuboring. \n\nMasalan: 125",
      );
      return;
    }

    let student: any;
    try {
      student = await this.userService.getStudentById(student_id);
    } catch (error) {
      console.log(error);
    }

    if (!student) {
      await ctx.reply(
        `❌ ${student_id} ID raqamli o'quvchi topilmadi. Iltimos, boshqa ID yuboring.`,
      );
      return;
    }

    const [, created] = await this.botChildRepo.findOrCreate({
      where: { parent_bot_id: bot_id, student_id },
      defaults: { parent_bot_id: bot_id, student_id },
    });

    await this.botRepo.update({ step: null }, { where: { bot_id } });

    await ctx.reply(
      created
        ? '✅ Farzandingiz saqlandi'
        : "ℹ️ Bu o'quvchi allaqachon saqlangan",
    );

    await this.childInfo(ctx, student_id);

    return this.my_children(ctx);
  }

  async childInfo(ctx: Context, student_id: number) {
    let student: any;
    try {
      student = await this.userService.getStudentById(student_id);
    } catch (error) {
      console.log(error);
    }

    if (!student) {
      await ctx.reply("O'quvchi topilmadi");
      return;
    }

    let courses: any;
    try {
      courses = await this.subscriptionsService.getByUserId(student_id);
    } catch (error) { }

    const course_titles = (courses || [])
      .map((subscription: any) => subscription.dataValues.course?.title)
      .filter(Boolean);

    await ctx.reply(
      `👤 <b>${student.name || ''} ${student.surname || ''}</b>\n` +
      `🆔 ID: ${student.id}\n` +
      `📞 Telefon: ${student.phone || "ko'rsatilmagan"}\n` +
      `📚 Kurslar: ${course_titles.length ? course_titles.join(', ') : 'mavjud emas'}`,
      { parse_mode: 'HTML' },
    );
  }

  async handleText(ctx: Context) {
    const bot_id = ctx.from.id;

    const botUser = await this.botRepo.findOne({ where: { bot_id } });

    if (botUser?.step == CHILD_ID_STEP && ctx.message && 'text' in ctx.message) {
      return this.saveChild(ctx);
    }

    await ctx.reply(`Noto'g'ri ma'lumot!`);
  }

  async reyting_courses(ctx: Context) {
    const bot_id = ctx.from.id;

    const user = await this.botRepo.findOne({ where: { bot_id } });

    if (!user?.user_id) {
      await ctx.reply('Foydalanuvchi topilmadi');
      return;
    }

    let courses: any;
    try {
      courses = await this.subscriptionsService.getByUserId(user?.user_id);
    } catch (error) { }

    if (!courses?.length) {
      await ctx.reply('Sizda hozircha kurslar mavjud emas.');
      return;
    }

    const buttons = courses.map((subscription) => {
      const course = subscription.dataValues.course;

      return [
        {
          text: course.title,
          callback_data: `reyting_course_${course.id}`,
        },
      ];
    });

    await ctx.reply("📊 Reytingni ko'rish uchun kursni tanlang:", {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  async courseReyting(ctx: Context, course_id: number) {
    const bot_id = ctx.from.id;

    const user = await this.botRepo.findOne({ where: { bot_id } });

    if (!user?.user_id) {
      await ctx.reply('Foydalanuvchi topilmadi');
      return;
    }

    let courses: any;
    try {
      courses = await this.subscriptionsService.getByUserId(user?.user_id);
    } catch (error) { }

    const subscription = (courses || []).find(
      (item: any) => item.dataValues.course?.id == course_id,
    );

    if (!subscription) {
      await ctx.reply('Kurs topilmadi.');
      return;
    }

    const course = subscription.dataValues.course;

    let reytings: any;
    try {
      reytings = await this.userService.getReyting(course.group_id, course.id);
    } catch (error) {
      console.log(error);
    }

    if (!reytings?.length) {
      await ctx.reply(`📊 <b>${course.title}</b>\n\nReyting mavjud emas.`, {
        parse_mode: 'HTML',
      });
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const row = (item: any, index: number) => {
      const place = medals[index] || `${index + 1}.`;
      const name =
        [item.name, item.surname].filter(Boolean).join(' ') || "Noma'lum";
      const ball = item.dataValues.totalReyting || 0;

      return `${place} ${name} — ${ball} ball${item.id == user.user_id ? ' 👈' : ''}`;
    };

    const rows = reytings.slice(0, 10).map(row);
    const my_place = reytings.findIndex((item: any) => item.id == user.user_id);

    if (my_place >= 10) {
      rows.push('...');
      rows.push(row(reytings[my_place], my_place));
    }

    await ctx.reply(`📊 <b>${course.title}</b>\n\n${rows.join('\n')}`, {
      parse_mode: 'HTML',
    });
  }

  async my_courses(ctx: Context) {
    const bot_id = ctx.from.id;

    const user = await this.botRepo.findOne({ where: { bot_id } });

    if (!user?.user_id) {
      await ctx.reply('Foydalanuvchi topilmadi');
      return;
    }
    let courses: any;
    try {
      courses = await this.subscriptionsService.getByUserId(user?.user_id);
    } catch (error) { }

    if (!courses?.length) {
      await ctx.reply('Sizda hozircha kurslar mavjud emas.');
      return;
    }

    const buttons = courses.map((subscription) => {
      const course = subscription.dataValues.course;
      console.log(course);

      return [
        {
          text: course.title,
          callback_data: `course_${course.id}`,
        },
      ];
    });

    await ctx.reply('📚 Kurslaringiz:', {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  async lessons(ctx: Context, courseId: number) {
    const bot_id = ctx.from.id;

    const user = await this.botRepo.findOne({ where: { bot_id } });

    if (!user?.user_id) {
      await ctx.reply('Foydalanuvchi topilmadi');
      return;
    }

    const course: any = await this.courseService.getAllLessons(courseId);
    const data = course.dataValues;

    if (!data?.lessons?.length) {
      await ctx.reply('Sizda hozircha kurslar mavjud emas.');
      return;
    }

    const buttons = data?.lessons.map((lesson) => {
      return [
        {
          text: lesson.title,
          callback_data: `lesson_${lesson.id}`,
        },
      ];
    });

    await ctx.reply('📚 Darslar:', {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  async lessonInfo(ctx: Context, lessonId: number) {
    const bot_id = ctx.from.id;

    const user = await this.botRepo.findOne({ where: { bot_id } });

    if (!user?.user_id) {
      await ctx.reply('Foydalanuvchi topilmadi');
      return;
    }

    const lesson: any = await this.lessonService.getById(lessonId);

    if (!lesson) {
      await ctx.reply('Dars mavjud emas.');
      return;
    }

    const buttons =
      [[
        {
          text: 'Test yechish',
          callback_data: `lesson_test_${lesson.id}`,
        },
        {
          text: 'Vazifa yuborish',
          callback_data: `lesson_task_${lesson.id}`,
        },
      ]];


    await ctx.reply(`📚 Dars: ${lesson.title}`, {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  async lessonTest(ctx: Context, lessonId: number) {
    const bot_id = ctx.from.id;

    const user = await this.botRepo.findOne({ where: { bot_id } });

    if (!user?.user_id) {
      await ctx.reply('Foydalanuvchi topilmadi');
      return;
    }

    const tests: any = await this.testsService.getById(lessonId, user.user_id);

    if (!tests) {
      await ctx.reply('Dars mavjud emas.');
      return;
    }

    const buttons =
      [[
        {
          text: 'Test yechish',
          callback_data: `lesson_test_${tests.id}`,
        },
        {
          text: 'Vazifa yuborish',
          callback_data: `lesson_task_${tests.id}`,
        },
      ]];

    await ctx.replyWithDocument(tests.test?.[0]?.question, {
      caption: `Testni yechib bo'lgach javoblarni "Test javoblarini yuborish" tugmasi orqali yuborishingiz mumkin`,
    });
    console.log(lessonId, 'lessonId');

    await ctx.reply(
      'Test javoblarini yuborish:',
      Markup.inlineKeyboard([
        Markup.button.webApp('Academic Success Hub', `https://ilmnur-front.vercel.app/test/${lessonId}?pdf=true`),
      ]),
    );
  }
}