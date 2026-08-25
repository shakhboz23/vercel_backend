import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Bot } from './models/bot.model';
import { BotChild } from './models/bot_child.model';
import { BOT_NAME, TASK_GROUP_ID } from '../app.constants';
import {
  InjectBot,
  Update,
  Ctx,
  Start,
  Help,
  On,
  Hears,
} from 'nestjs-telegraf';
import { Context, Telegraf, Markup, Input } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { UserService } from 'src/user/user.service';
import { RoleName } from 'src/activity/models/activity.models';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { CourseService } from 'src/course/course.service';
import { LessonService } from 'src/lesson/lesson.service';
import { TestsService } from 'src/test/test.service';
import { User } from 'src/user/models/user.models';
import { Group } from 'src/group/models/group.models';
import { ReytingService } from 'src/reyting/reyting.service';
import { FinishedType } from 'src/reyting/models/reyting.models';

const CHILD_ID_STEP = 'child_id';
const NAME_STEP = 'name';
const SURNAME_STEP = 'surname';
const PASSWORD_STEP = 'password';
const TASK_STEP = 'task';

interface TaskMediaEntry {
  type: 'photo' | 'document' | 'video';
  fileId: string;
  caption?: string;
}

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot) private botRepo: typeof Bot,
    @InjectModel(BotChild) private botChildRepo: typeof BotChild,
    @InjectModel(Group) private groupRepo: typeof Group,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>,
    private readonly userService: UserService,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
    private readonly courseService: CourseService,
    private readonly lessonService: LessonService,
    private readonly testsService: TestsService,
    private readonly reytingService: ReytingService,
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

      if (process.env.NODE_ENV === 'production') {
        const webhookUrl = 'https://api.ashacademy.uz/api/webhook/bot';
        await this.bot.telegram.setWebhook(webhookUrl);
        console.log(`Webhook registered at: ${webhookUrl}`);
      }
    } catch (error) {
      console.log(error)
    }
  }

  // Handle incoming updates
  async handleUpdate(update: any): Promise<void> {
    try {
      console.log(update);
      await this.bot.handleUpdate(update);
    } catch (error: any) {
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

      if (!botUser) {
        await this.botRepo.create({
          bot_id: bot_id,
          // name: ctx.from.first_name,
          // surname: ctx.from.last_name,
          username: ctx.from.username,
        });
      }

      return this.askRole(ctx);
    } catch (error) {
      console.log(error)
    }
  }

  private mainMenuButtons(role: string): string[][] {
    if (role === 'parent') {
      return [['Farzandlarim'], ['Profil']];
    }

    return [
      ['Statistika', 'Kurslar'],
      ['Reyting', 'Davomat'],
      ['Profil'],
    ];
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
    return this.continueAfterRole(ctx);
  }

  async continueAfterRole(ctx: Context) {
    try {
      const bot_id = ctx.from.id;
      const botUser = await this.botRepo.findOne({ where: { bot_id } });
      let user;
      try {
        user = await this.userService.getById(botUser?.user_id);
      } catch (error) {

      }

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

        await ctx.reply(
          'Academic Success Hub ga xush kelibsiz',
          {
            parse_mode: 'HTML',
            ...Markup.keyboard(this.mainMenuButtons(botUser.dataValues.role))
              .oneTime()
              .resize(),
          },
        );

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
      bot_user = await this.userService.register({ password, name: user.name, surname: user.surname, role: user.role || RoleName.student, phone: user.phone, is_active: true });
      await this.botRepo.update({ user_id: bot_user?.data.get('id'), step: null }, {
        where: { bot_id: user.bot_id },
        returning: true
      })
      const url = `https://www.ashacademy.uz/login?token=${bot_user.token}`;
      await ctx.reply(
        'Ro\'yxatdan muvaffaqiyatli o\'tdingiz!',
        {
          parse_mode: 'HTML',
          ...Markup.keyboard(this.mainMenuButtons(user.role))
            .oneTime()
            .resize(),
        },
      );
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

    await this.botRepo.update({ name, step: SURNAME_STEP }, {
      where: { bot_id },
    });
    await ctx.reply('Iltimos familiyangizni kiriting: 👇', {
      parse_mode: 'HTML',
      ...Markup.removeKeyboard(),
    });
  }

  async setSurname(@Ctx() ctx: Context) {
    const bot_id = ctx.from.id;
    const message = ctx.message as Message.TextMessage;
    const surname = message.text.trim();

    await this.botRepo.update({ surname }, {
      where: { bot_id },
    });
    return this.handlePassword(ctx);
  }

  async notifyPaymentDue(
    user_id: number,
    courseTitle: string,
    amount: number,
    dueDate: Date,
  ): Promise<void> {
    const date = new Date(dueDate);
    const dateStr = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;

    const text =
      `⏰ <b>Eslatma!</b>\n\n` +
      `"<b>${courseTitle}</b>" kursi bo'yicha oylik to'lov muddati yaqinlashmoqda.\n\n` +
      `📅 To'lov sanasi: <b>${dateStr}</b>\n` +
      `💰 To'lanishi kerak: <b>${amount.toLocaleString('ru-RU')} so'm</b>\n\n` +
      `Iltimos, o'z vaqtida to'lovni amalga oshiring.`;

    const studentBot = await this.botRepo.findOne({ where: { user_id } });
    if (studentBot?.status) {
      await this.bot.telegram
        .sendMessage(studentBot.bot_id, text, { parse_mode: 'HTML' })
        .catch((error) => console.log(error));
    }

    const parents = await this.botChildRepo.findAll({
      where: { student_id: user_id },
    });
    for (const parent of parents) {
      await this.bot.telegram
        .sendMessage(parent.parent_bot_id, text, { parse_mode: 'HTML' })
        .catch((error) => console.log(error));
    }
  }

  async notifySubscriptionAdded(
    user_id: number,
    courseTitle: string,
  ): Promise<void> {
    const text =
      `🎉 Tabriklaymiz!\n\n` +
      `Siz "<b>${courseTitle}</b>" kursiga qo'shildingiz.\n\n` +
      `Pastdagi <b>Kurslar</b> tugmasi orqali uni ko'rishingiz mumkin.`;

    const studentBot = await this.botRepo.findOne({ where: { user_id } });
    if (studentBot?.status) {
      await this.bot.telegram
        .sendMessage(studentBot.bot_id, text, { parse_mode: 'HTML' })
        .catch((error) => console.log(error));
    }
  }

  private readonly attendanceStatusLabels: Record<number, { text: string; icon: string }> = {
    0: { text: 'kelmadi', icon: '❌' },
    1: { text: 'kechikdi', icon: '⏰' },
    2: { text: 'keldi', icon: '✅' },
  };

  async notifyAttendance(
    user_id: number,
    courseTitle: string,
    status: number,
  ): Promise<void> {
    const parents = await this.botChildRepo.findAll({
      where: { student_id: user_id },
    });
    if (!parents.length) return;

    let student: any;
    try {
      student = await this.userService.getById(user_id);
    } catch (error) { }

    const studentName = [student?.name, student?.surname].filter(Boolean).join(' ') || "O'quvchi";
    const statusInfo = this.attendanceStatusLabels[status] || { text: "noma'lum", icon: 'ℹ️' };

    const text =
      `${statusInfo.icon} <b>Davomat xabari</b>\n\n` +
      `👤 O'quvchi: <b>${studentName}</b>\n` +
      `📚 Kurs: <b>${courseTitle}</b>\n` +
      `📌 Holat: <b>${statusInfo.text}</b>`;

    for (const parent of parents) {
      await this.bot.telegram
        .sendMessage(parent.parent_bot_id, text, { parse_mode: 'HTML' })
        .catch((error) => console.log(error));
    }
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

    const buttons = children.map((child, index) => {
      const student: any = child.student;
      const name = [student?.name, student?.surname].filter(Boolean).join(' ');

      return [
        {
          text: `${index + 1}.${name || "Noma'lum"}`,
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
    const student_id = message.text.trim();

    if (!Number.isInteger(+student_id) || +student_id <= 0) {
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
      where: { parent_bot_id: bot_id, student_id: student.id },
      defaults: { parent_bot_id: bot_id, student_id: student.id },
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

  async childInfo(ctx: Context, student_id: string) {
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
      courses = await this.subscriptionsService.getByUserId(student.id);
    } catch (error) { }

    const course_titles = (courses || [])
      .map((subscription: any) => subscription.dataValues.course?.title)
      .filter(Boolean);

    await ctx.reply(
      `👤 <b>${student.name || ''} ${student.surname || ''}</b>\n` +
        (student.student_id ? `🆔 ID: ${student.student_id}\n` : ``) +
        // `📞 Telefon: ${student.phone || "ko'rsatilmagan"}\n` +
      `📚 Kurslar: ${course_titles.length ? course_titles.join(', ') : 'mavjud emas'}`,
      { parse_mode: 'HTML' },
    );

    await ctx.reply("Nimani ko'rmoqchisiz?", {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📅 Davomat', callback_data: `child_attendance_${student_id}` }],
          [{ text: '📊 Natijalar', callback_data: `child_results_${student_id}` }],
          [{ text: '📝 Vazifalar', callback_data: `child_tasks_${student_id}` }],
        ],
      },
    });
  }

  async childResults(ctx: Context, student_id: string) {
    let student: any;
    try {
      student = await this.userService.getStudentById(student_id);
    } catch (error) { }

    if (!student) {
      await ctx.reply("O'quvchi topilmadi");
      return;
    }

    const groups = await this.getUserGroups(student.id);

    if (!groups.size) {
      await ctx.reply('Farzandingizda hozircha guruhlar mavjud emas.');
      return;
    }

    if (groups.size === 1) {
      const [groupId] = groups.keys();
      return this.sendStatistics(ctx, student.id, groupId);
    }

    const buttons = [...groups.entries()].map(([groupId, title]) => [
      { text: title, callback_data: `child_stats_${student_id}_${groupId}` },
    ]);

    await ctx.reply("📊 Natijalarni ko'rish uchun guruhni tanlang:", {
      reply_markup: { inline_keyboard: buttons },
    });
  }

  async childAttendance(ctx: Context, student_id: string) {
    let student: any;
    try {
      student = await this.userService.getStudentById(student_id);
    } catch (error) { }

    if (!student) {
      await ctx.reply("O'quvchi topilmadi");
      return;
    }

    const groups = await this.getUserGroups(student.id);

    if (!groups.size) {
      await ctx.reply('Farzandingizda hozircha guruhlar mavjud emas.');
      return;
    }

    const buttons = [...groups.entries()].map(([groupId, title]) => [
      { text: title, callback_data: `child_attendance_group_${student_id}_${groupId}` },
    ]);

    await ctx.reply("📅 Davomatni ko'rish uchun guruhni tanlang:", {
      reply_markup: { inline_keyboard: buttons },
    });
  }

  async childAttendanceGroupCourses(ctx: Context, student_id: string, group_id: number) {
    let student: any;
    try {
      student = await this.userService.getStudentById(student_id);
    } catch (error) { }

    if (!student) {
      await ctx.reply("O'quvchi topilmadi");
      return;
    }

    let subscriptions: any;
    try {
      subscriptions = await this.subscriptionsService.getByUserId(student.id);
    } catch (error) { }

    const courses = ((subscriptions as any[]) || [])
      .map((subscription: any) => subscription.dataValues.course)
      .filter((course: any) => course?.group_id == group_id);

    if (!courses.length) {
      await ctx.reply('Bu guruhda farzandingizning kurslari mavjud emas.');
      return;
    }

    const buttons = courses.map((course: any) => [
      { text: course.title, callback_data: `child_attendance_course_${student_id}_${course.id}` },
    ]);

    await ctx.reply("📚 Davomatni ko'rish uchun kursni tanlang:", {
      reply_markup: { inline_keyboard: buttons },
    });
  }

  async childAttendanceForCourse(ctx: Context, student_id: string, course_id: number) {
    let student: any;
    try {
      student = await this.userService.getStudentById(student_id);
    } catch (error) { }

    if (!student) {
      await ctx.reply("O'quvchi topilmadi");
      return;
    }

    let subscriptions: any;
    try {
      subscriptions = await this.subscriptionsService.getByUserId(student.id);
    } catch (error) { }

    const subscription = ((subscriptions as any[]) || []).find(
      (item: any) => item.dataValues.course?.id == course_id,
    );

    if (!subscription) {
      await ctx.reply('Kurs topilmadi.');
      return;
    }

    const course = subscription.dataValues.course;

    let analytics: any;
    try {
      analytics = await this.userService.getUserAnalytics(student.id, course.group_id);
    } catch (error) {
      console.log(error);
      await ctx.reply('Davomatni olishda xatolik yuz berdi.');
      return;
    }

    const courseSubscription = (analytics?.subscriptions || []).find(
      (item: any) => item.course_id == course_id,
    );
    const attendance = courseSubscription?.attendance || {
      attended_classes: 0,
      scheduled_classes: 0,
      percentage: 0,
    };

    await ctx.reply(
      `📅 <b>${course.title}</b> — Davomat\n\n` +
      `✅ Qatnashgan darslar: <b>${attendance.attended_classes}</b>\n` +
      `📚 Jami darslar: <b>${attendance.scheduled_classes}</b>\n` +
      `📊 Foiz: <b>${attendance.percentage}%</b>`,
      { parse_mode: 'HTML' },
    );
  }

  async childTasks(ctx: Context, student_id: string) {
    let student: any;
    try {
      student = await this.userService.getStudentById(student_id);
    } catch (error) { }

    if (!student) {
      await ctx.reply("O'quvchi topilmadi");
      return;
    }

    let courses: any;
    try {
      courses = await this.subscriptionsService.getByUserId(student.id);
    } catch (error) { }

    if (!courses?.length) {
      await ctx.reply('Farzandingizda hozircha kurslar mavjud emas.');
      return;
    }

    const buttons = courses.map((subscription: any) => {
      const course = subscription.dataValues.course;

      return [
        {
          text: course.title,
          callback_data: `child_tasks_course_${student_id}_${course.id}`,
        },
      ];
    });

    await ctx.reply("📝 Vazifalarni ko'rish uchun kursni tanlang:", {
      reply_markup: { inline_keyboard: buttons },
    });
  }

  async childTasksForCourse(ctx: Context, student_id: string, course_id: number) {
    let student: any;
    try {
      student = await this.userService.getStudentById(student_id);
    } catch (error) { }

    if (!student) {
      await ctx.reply("O'quvchi topilmadi");
      return;
    }

    const publishedLessons = await this.getPublishedLessonsSorted(course_id);

    if (!publishedLessons.length) {
      await ctx.reply('Bu kursda hozircha darslar mavjud emas.');
      return;
    }

    const lines = ['📝 <b>Vazifalar holati</b>', ''];
    let previousCompleted = true;

    for (const lesson of publishedLessons) {
      const isCompleted = await this.testsService.hasCompletedTest(
        lesson.id,
        student.id,
      );
      const isLocked = !previousCompleted;

      lines.push(`${isCompleted ? '✅' : isLocked ? '🔒' : '⏳'} ${lesson.title}`);
      previousCompleted = isCompleted;
    }

    await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
  }

  async handleText(ctx: Context) {
    const bot_id = ctx.from.id;

    const botUser = await this.botRepo.findOne({ where: { bot_id } });

    if (botUser?.step && ctx.message && 'text' in ctx.message) {
      switch (botUser.step) {
        case CHILD_ID_STEP:
          return this.saveChild(ctx);
        case NAME_STEP:
          return this.setName(ctx);
        case SURNAME_STEP:
          return this.setSurname(ctx);
        case PASSWORD_STEP:
          return this.setPassword(ctx);
        case TASK_STEP:
          return this.submitTaskText(ctx, botUser);
      }
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

  async statistics(ctx: Context) {
    const bot_id = ctx.from.id;

    const botUser = await this.botRepo.findOne({ where: { bot_id } });

    if (!botUser?.user_id) {
      await ctx.reply('Foydalanuvchi topilmadi');
      return;
    }

    const groups = await this.getUserGroups(botUser.user_id);

    if (!groups.size) {
      await ctx.reply('Sizda hozircha guruhlar mavjud emas.');
      return;
    }

    if (groups.size === 1) {
      const [groupId] = groups.keys();
      return this.sendStatistics(ctx, botUser.user_id, groupId);
    }

    const buttons = [...groups.entries()].map(([groupId, title]) => [
      { text: title, callback_data: `stats_group_${groupId}` },
    ]);

    await ctx.reply("📊 Statistikani ko'rish uchun guruhni tanlang:", {
      reply_markup: { inline_keyboard: buttons },
    });
  }

  async statisticsForGroup(ctx: Context, group_id: number) {
    const bot_id = ctx.from.id;

    const botUser = await this.botRepo.findOne({ where: { bot_id } });

    if (!botUser?.user_id) {
      await ctx.reply('Foydalanuvchi topilmadi');
      return;
    }

    return this.sendStatistics(ctx, botUser.user_id, group_id);
  }

  async childStatisticsForGroup(ctx: Context, student_id: number, group_id: number) {
    return this.sendStatistics(ctx, student_id, group_id);
  }

  async attendance(ctx: Context) {
    const bot_id = ctx.from.id;

    const botUser = await this.botRepo.findOne({ where: { bot_id } });

    if (!botUser?.user_id) {
      await ctx.reply('Foydalanuvchi topilmadi');
      return;
    }

    const groups = await this.getUserGroups(botUser.user_id);

    if (!groups.size) {
      await ctx.reply('Sizda hozircha guruhlar mavjud emas.');
      return;
    }

    const buttons = [...groups.entries()].map(([groupId, title]) => [
      { text: title, callback_data: `attendance_group_${groupId}` },
    ]);

    await ctx.reply("📅 Davomatni ko'rish uchun guruhni tanlang:", {
      reply_markup: { inline_keyboard: buttons },
    });
  }

  async attendanceGroupCourses(ctx: Context, group_id: number) {
    const bot_id = ctx.from.id;

    const botUser = await this.botRepo.findOne({ where: { bot_id } });

    if (!botUser?.user_id) {
      await ctx.reply('Foydalanuvchi topilmadi');
      return;
    }

    let subscriptions: any;
    try {
      subscriptions = await this.subscriptionsService.getByUserId(botUser.user_id);
    } catch (error) { }

    const courses = ((subscriptions as any[]) || [])
      .map((subscription: any) => subscription.dataValues.course)
      .filter((course: any) => course?.group_id == group_id);

    if (!courses.length) {
      await ctx.reply('Bu guruhda kurslaringiz mavjud emas.');
      return;
    }

    const buttons = courses.map((course: any) => [
      { text: course.title, callback_data: `attendance_course_${course.id}` },
    ]);

    await ctx.reply("📚 Davomatni ko'rish uchun kursni tanlang:", {
      reply_markup: { inline_keyboard: buttons },
    });
  }

  async attendanceForCourse(ctx: Context, course_id: number) {
    const bot_id = ctx.from.id;

    const botUser = await this.botRepo.findOne({ where: { bot_id } });

    if (!botUser?.user_id) {
      await ctx.reply('Foydalanuvchi topilmadi');
      return;
    }

    let subscriptions: any;
    try {
      subscriptions = await this.subscriptionsService.getByUserId(botUser.user_id);
    } catch (error) { }

    const subscription = ((subscriptions as any[]) || []).find(
      (item: any) => item.dataValues.course?.id == course_id,
    );

    if (!subscription) {
      await ctx.reply('Kurs topilmadi.');
      return;
    }

    const course = subscription.dataValues.course;

    let analytics: any;
    try {
      analytics = await this.userService.getUserAnalytics(botUser.user_id, course.group_id);
    } catch (error) {
      console.log(error);
      await ctx.reply('Davomatni olishda xatolik yuz berdi.');
      return;
    }

    const courseSubscription = (analytics?.subscriptions || []).find(
      (item: any) => item.course_id == course_id,
    );
    const attendance = courseSubscription?.attendance || {
      attended_classes: 0,
      scheduled_classes: 0,
      percentage: 0,
    };

    await ctx.reply(
      `📅 <b>${course.title}</b> — Davomat\n\n` +
      `✅ Qatnashgan darslar: <b>${attendance.attended_classes}</b>\n` +
      `📚 Jami darslar: <b>${attendance.scheduled_classes}</b>\n` +
      `📊 Foiz: <b>${attendance.percentage}%</b>`,
      { parse_mode: 'HTML' },
    );
  }

  private readonly roleLabels: Record<string, string> = {
    student: "O'quvchi",
    teacher: "O'qituvchi",
    parent: 'Ota-ona',
    admin: 'Admin',
    super_admin: 'Super admin',
  };

  async profile(ctx: Context) {
    const bot_id = ctx.from.id;

    const botUser = await this.botRepo.findOne({ where: { bot_id } });

    if (!botUser?.user_id) {
      await ctx.reply('Foydalanuvchi topilmadi');
      return;
    }

    let user: any;
    try {
      user = await this.userService.getById(botUser.user_id);
    } catch (error) {
      console.log(error);
    }

    if (!user) {
      await ctx.reply('Foydalanuvchi topilmadi');
      return;
    }

    const roleLabel = this.roleLabels[user.current_role] || user.current_role || "ko'rsatilmagan";

    await ctx.reply(
      `👤 <b>Profil ma'lumotlari</b>\n\n` +
        (user.student_id ? `🆔 ID: ${user.student_id}\n` : ``) +
        `👤 Ism: <b>${user.name || "ko'rsatilmagan"}</b>\n` +
        `👤 Familiya: <b>${user.surname || "ko'rsatilmagan"}</b>\n` +
        `📞 Telefon: <b>${user.phone || "ko'rsatilmagan"}</b>\n` +
      `🎓 Rol: <b>${roleLabel}</b>`,
      {
        parse_mode: 'HTML',
        ...Markup.keyboard([
          ["Parolni o'zgaritish", "Telefon raqamni o'zgartirish"],
        ])
          .oneTime()
          .resize(),
      },
    );
  }

  private async getUserGroups(user_id: number): Promise<Map<number, string>> {
    let subscriptions: any;
    try {
      subscriptions = await this.subscriptionsService.getByUserId(user_id);
    } catch (error) { }

    const groups = new Map<number, string>();
    for (const subscription of (subscriptions as any[]) || []) {
      const course = subscription.dataValues.course;
      const groupId = course?.group_id;

      if (!groupId || groups.has(groupId)) continue;
      groups.set(groupId, course.group?.title || course.title);
    }

    return groups;
  }

  private readonly monthNames = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
  ];

  private statusIcon(status: string): string {
    if (status === "ko'tarildi" || status === 'oshdi' || status === 'yangi') return '📈';
    if (status === 'tushdi' || status === 'kamaydi') return '📉';
    return '➖';
  }

  private async sendStatistics(ctx: Context, user_id: number, group_id: number) {
    let analytics: any;
    try {
      analytics = await this.userService.getUserAnalytics(user_id, group_id);
    } catch (error) {
      console.log(error);
      await ctx.reply('Statistikani olishda xatolik yuz berdi.');
      return;
    }

    const ratingBall = analytics?.ratingBallStats || {};
    const ratingPosition = analytics?.ratingStats || {};
    const attendance = analytics?.attendanceStats || {};
    const upcomingTests = analytics?.upcomingTests || [];

    const monthLabel = attendance.month
      ? `${this.monthNames[attendance.month - 1]} ${attendance.year}`
      : '';

    const lines = [
      '📊 <b>Statistika</b>',
      '',
      `🏆 Umumiy ball: <b>${ratingBall.currentBall || 0}</b>` +
      (ratingBall.difference
        ? ` (${this.statusIcon(ratingBall.status)} ${ratingBall.difference} ball ${ratingBall.status})`
        : ''),
      `👥 Guruh reytingi: <b>#${ratingPosition.currentPosition || 0}</b>` +
      (ratingPosition.difference
        ? ` (${this.statusIcon(ratingPosition.status)} ${ratingPosition.difference} o'rin ${ratingPosition.status})`
        : ''),
      `📅 Davomat (${monthLabel}): <b>${attendance.percentage ?? 0}%</b>` +
      ` (✅ ${attendance.present || 0}, ⏱ ${attendance.late || 0}, ❌ ${attendance.absent || 0})`,
      `📝 Navbatdagi testlar: <b>${upcomingTests.length}</b>`,
    ];

    if (upcomingTests.length) {
      lines.push('');
      lines.push('<b>Yaqin orada:</b>');
      for (const test of upcomingTests.slice(0, 5)) {
        const startDate = new Date(test.start_date);
        const dateStr = `${String(startDate.getDate()).padStart(2, '0')}.${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        const courseTitle = test.course_title ? ` (${test.course_title})` : '';

        lines.push(`• ${test.lesson_title}${courseTitle} — ${dateStr}`);
      }
    }

    await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
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

  private async getPublishedLessonsSorted(courseId: number): Promise<any[]> {
    const course: any = await this.courseService.getAllLessons(courseId);
    const data = course.dataValues;

    return (data?.lessons || [])
      .filter((lesson: any) => lesson.published)
      .sort((a: any, b: any) => (a.position ?? a.id) - (b.position ?? b.id));
  }

  private async isLessonLocked(
    courseId: number,
    lessonId: number,
    user_id: number,
  ): Promise<boolean> {
    const publishedLessons = await this.getPublishedLessonsSorted(courseId);
    const index = publishedLessons.findIndex(
      (lesson: any) => lesson.id == lessonId,
    );

    if (index <= 0) return false;

    const previousLesson = publishedLessons[index - 1];
    return !(await this.testsService.hasCompletedTest(
      previousLesson.id,
      user_id,
    ));
  }

  async lessons(ctx: Context, courseId: number) {
    const bot_id = ctx.from.id;

    const user = await this.botRepo.findOne({ where: { bot_id } });

    if (!user?.user_id) {
      await ctx.reply('Foydalanuvchi topilmadi');
      return;
    }

    const publishedLessons = await this.getPublishedLessonsSorted(courseId);

    if (!publishedLessons.length) {
      await ctx.reply('Sizda hozircha kurslar mavjud emas.');
      return;
    }

    const buttons = [];
    let previousCompleted = true;

    for (const lesson of publishedLessons) {
      const isCompleted = await this.testsService.hasCompletedTest(
        lesson.id,
        user.user_id,
      );
      const isLocked = !previousCompleted;

      buttons.push([
        {
          text: `${lesson.title}${isCompleted ? ' ✅' : isLocked ? ' 🔒' : ''}`,
          callback_data: isLocked
            ? `lesson_locked_${lesson.id}`
            : `lesson_${lesson.id}`,
        },
      ]);

      previousCompleted = isCompleted;
    }

    await ctx.reply('📚 Darslar:', {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  async lessonLocked(ctx: Context, lessonId: number) {
    const bot_id = ctx.from.id;

    const user = await this.botRepo.findOne({ where: { bot_id } });

    if (!user?.user_id) {
      await ctx.answerCbQuery('Foydalanuvchi topilmadi', { show_alert: true });
      return;
    }

    const lesson: any = await this.lessonService.getById(lessonId);

    if (!lesson) {
      await ctx.answerCbQuery('Dars mavjud emas.', { show_alert: true });
      return;
    }

    const stillLocked = await this.isLessonLocked(
      lesson.course_id,
      lessonId,
      user.user_id,
    );

    if (stillLocked) {
      await ctx.answerCbQuery(
        '❌ Siz hali oldingi testni yechmagansiz!',
        { show_alert: true },
      );
      return;
    }

    await ctx.answerCbQuery();
    return this.lessonInfo(ctx, lessonId);
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

    const isCompleted = await this.testsService.hasCompletedTest(
      lesson.id,
      user.user_id,
    );

    const buttons = isCompleted
      ? [[
          {
            text: 'Vazifa yuborish',
            callback_data: `lesson_task_${lesson.id}`,
          },
        ]]
      : [[
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

    const pdfUrl: string = tests.test?.[0]?.question;
    const fileName = `${(tests.lesson?.title || 'test').replace(/[\\/:*?"<>|]/g, '').trim() || 'test'}.pdf`;

    await ctx.replyWithDocument(Input.fromURLStream(pdfUrl, fileName), {
      caption: `Testni yechib bo'lgach javoblarni "Test javoblarini yuborish" tugmasi orqali yuborishingiz mumkin`,
    });
    console.log(lessonId, 'lessonId');

    await ctx.reply(
      'Test javoblarini yuborish:',
      Markup.inlineKeyboard([
        Markup.button.webApp('Academic Success Hub', `https://www.ashacademy.uz/test/${lessonId}?pdf=true`),
      ]),
    );
  }

  async lessonTask(ctx: Context, lessonId: number) {
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

    await this.botRepo.update(
      { step: TASK_STEP, step_data: String(lessonId) },
      { where: { bot_id } },
    );

    await ctx.reply(
      '📎 Vazifangizni yuboring (matn, bir nechta rasm va/yoki fayl shaklida). Yuborilgan xabaringiz guruhga yetkaziladi.',
    );
  }

  private async buildTaskInfo(
    botUser: Bot,
    lessonId: number,
  ): Promise<{ header: string; courseId: number }> {
    let student: any;
    try {
      student = await this.userService.getById(botUser.user_id);
    } catch (error) { }

    let lesson: any;
    try {
      lesson = await this.lessonService.getById(lessonId);
    } catch (error) { }

    let groupTitle = '';
    const groupId = lesson?.course?.group_id;
    if (groupId) {
      try {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        groupTitle = group?.title || '';
      } catch (error) { }
    }

    const studentName =
      [student?.name, student?.surname].filter(Boolean).join(' ') ||
      botUser.username ||
      "Noma'lum";

    const header =
      `📝 <b>Yangi vazifa</b>\n` +
      `👤 ${studentName}` +
      (student?.student_id ? ` (ID: ${student.student_id})` : '') +
      `\n👥 Guruh: ${groupTitle || "noma'lum"}` +
      `\n📚 Kurs: ${lesson?.course?.title || "noma'lum"}` +
      `\n📖 Dars: ${lesson?.title || lessonId}` +
      `\n🧪 Test: ${lesson?.title || lessonId}`;

    return { header, courseId: lesson?.course_id };
  }

  private readonly taskStatusLabels: Record<
    'full' | 'partial' | 'none',
    { text: string; icon: string; ball: number }
  > = {
    full: { text: "To'liq bajarildi", icon: '✅', ball: 10 },
    partial: { text: "To'liq emas", icon: '🟡', ball: 8 },
    none: { text: 'Bajarilmagan', icon: '❌', ball: 0 },
  };

  private taskStatusButtons(lessonId: number, studentUserId: number) {
    return {
      inline_keyboard: (
        Object.keys(this.taskStatusLabels) as Array<'full' | 'partial' | 'none'>
      ).map((status) => [
        {
          text: `${this.taskStatusLabels[status].icon} ${this.taskStatusLabels[status].text}`,
          callback_data: `task_status_${status}_${lessonId}_${studentUserId}`,
        },
      ]),
    };
  }

  async submitTaskText(ctx: Context, botUser: Bot) {
    const message = ctx.message as Message.TextMessage;
    const text = message.text.trim();
    const lessonId = Number(botUser.step_data);

    const { header } = await this.buildTaskInfo(botUser, lessonId);

    try {
      await this.bot.telegram.sendMessage(
        TASK_GROUP_ID,
        `${header}\n\n${text}`,
        {
          parse_mode: 'HTML',
          reply_markup: this.taskStatusButtons(lessonId, botUser.user_id),
        },
      );
      await this.botRepo.update(
        { step: null, step_data: null },
        { where: { bot_id: botUser.bot_id } },
      );
      await ctx.reply('✅ Vazifangiz yuborildi');
      await this.lessonInfo(ctx, lessonId);
    } catch (error) {
      console.log(error);
      await ctx.reply('❌ Vazifani yuborishda xatolik yuz berdi');
    }
  }

  private readonly taskMediaGroups = new Map<
    string,
    {
      botId: number;
      lessonId: number;
      botUser: Bot;
      entries: TaskMediaEntry[];
      timer: ReturnType<typeof setTimeout>;
    }
  >();

  private readonly TASK_MEDIA_GROUP_DELAY = 1200;

  async handleMedia(ctx: Context) {
    const bot_id = ctx.from.id;
    const botUser = await this.botRepo.findOne({ where: { bot_id } });

    if (botUser?.step !== TASK_STEP || !ctx.message) {
      await ctx.reply(`Noto'g'ri ma'lumot!`);
      return;
    }

    const message = ctx.message as any;

    let type: TaskMediaEntry['type'] | null = null;
    let fileId: string | null = null;

    if ('photo' in message) {
      type = 'photo';
      const photos = message.photo;
      fileId = photos[photos.length - 1].file_id;
    } else if ('document' in message) {
      type = 'document';
      fileId = message.document.file_id;
    } else if ('video' in message) {
      type = 'video';
      fileId = message.video.file_id;
    }

    if (!type || !fileId) {
      await ctx.reply(`Noto'g'ri ma'lumot!`);
      return;
    }

    const caption = (message.caption as string | undefined)?.trim();
    const lessonId = Number(botUser.step_data);
    const mediaGroupId = message.media_group_id as string | undefined;

    if (!mediaGroupId) {
      try {
        await this.sendTaskMedia(botUser, lessonId, [{ type, fileId, caption }]);
        await this.botRepo.update(
          { step: null, step_data: null },
          { where: { bot_id } },
        );
        await ctx.reply('✅ Vazifangiz yuborildi');
        await this.lessonInfo(ctx, lessonId);
      } catch (error) {
        console.log(error);
        await ctx.reply('❌ Vazifani yuborishda xatolik yuz berdi');
      }
      return;
    }

    const key = `${bot_id}_${mediaGroupId}`;
    const existing = this.taskMediaGroups.get(key);

    if (existing) {
      clearTimeout(existing.timer);
      existing.entries.push({ type, fileId, caption });
      existing.timer = setTimeout(
        () => this.flushTaskMediaGroup(ctx, key),
        this.TASK_MEDIA_GROUP_DELAY,
      );
      return;
    }

    this.taskMediaGroups.set(key, {
      botId: bot_id,
      lessonId,
      botUser,
      entries: [{ type, fileId, caption }],
      timer: setTimeout(
        () => this.flushTaskMediaGroup(ctx, key),
        this.TASK_MEDIA_GROUP_DELAY,
      ),
    });
  }

  private async flushTaskMediaGroup(ctx: Context, key: string) {
    const group = this.taskMediaGroups.get(key);

    if (!group) {
      return;
    }

    this.taskMediaGroups.delete(key);

    try {
      await this.sendTaskMedia(group.botUser, group.lessonId, group.entries);
      await this.botRepo.update(
        { step: null, step_data: null },
        { where: { bot_id: group.botId } },
      );
      await ctx.reply('✅ Vazifangiz yuborildi');
      await this.lessonInfo(ctx, group.lessonId);
    } catch (error) {
      console.log(error);
      await ctx.reply('❌ Vazifani yuborishda xatolik yuz berdi');
    }
  }

  private async sendTaskMedia(
    botUser: Bot,
    lessonId: number,
    entries: TaskMediaEntry[],
  ) {
    const { header } = await this.buildTaskInfo(botUser, lessonId);
    const captionText = entries.find((entry) => entry.caption)?.caption;
    const fullCaption = captionText ? `${header}\n\n${captionText}` : header;
    const buttons = this.taskStatusButtons(lessonId, botUser.user_id);

    // Telegram doesn't allow mixing documents with photos/videos in one album,
    // so send visual media and documents as separate groups.
    const visualEntries = entries.filter((entry) => entry.type !== 'document');
    const documentEntries = entries.filter((entry) => entry.type === 'document');
    const groups = [visualEntries, documentEntries].filter((group) => group.length > 0);

    let captionUsed = false;

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const isLastGroup = i === groups.length - 1;
      const caption = !captionUsed ? fullCaption : undefined;

      if (group.length === 1) {
        const [entry] = group;
        const options: any = { parse_mode: 'HTML' };

        if (caption) {
          options.caption = caption;
          captionUsed = true;
        }

        if (isLastGroup) {
          options.reply_markup = buttons;
        }

        if (entry.type === 'photo') {
          await this.bot.telegram.sendPhoto(TASK_GROUP_ID, entry.fileId, options);
        } else if (entry.type === 'video') {
          await this.bot.telegram.sendVideo(TASK_GROUP_ID, entry.fileId, options);
        } else {
          await this.bot.telegram.sendDocument(TASK_GROUP_ID, entry.fileId, options);
        }
      } else {
        const media = group.map((entry, idx) => ({
          type: entry.type,
          media: entry.fileId,
          ...(idx === 0 && caption ? { caption, parse_mode: 'HTML' as const } : {}),
        }));

        if (caption) {
          captionUsed = true;
        }

        await this.bot.telegram.sendMediaGroup(TASK_GROUP_ID, media as any);

        if (isLastGroup) {
          await this.bot.telegram.sendMessage(
            TASK_GROUP_ID,
            '⬆️ Vazifani baholang',
            { reply_markup: buttons },
          );
        }
      }
    }
  }

  async gradeTask(
    ctx: Context,
    status: 'full' | 'partial' | 'none',
    lessonId: number,
    studentUserId: number,
  ) {
    const statusInfo = this.taskStatusLabels[status];

    if (!statusInfo) {
      return;
    }

    let lesson: any;
    try {
      lesson = await this.lessonService.getById(lessonId);
    } catch (error) { }

    if (!lesson) {
      await ctx.answerCbQuery('Dars topilmadi', { show_alert: true });
      return;
    }

    try {
      await this.reytingService.create(
        {
          ball: statusInfo.ball,
          lesson_id: lessonId,
          course_id: lesson.course_id,
          finished_type: FinishedType.task,
        },
        studentUserId,
      );
    } catch (error) {
      console.log(error);
      await ctx.answerCbQuery('❌ Xatolik yuz berdi', { show_alert: true });
      return;
    }

    await ctx.answerCbQuery(
      `${statusInfo.icon} ${statusInfo.text} (${statusInfo.ball} ball)`,
    );

    try {
      await ctx.editMessageReplyMarkup({
        inline_keyboard: [
          [
            {
              text: `${statusInfo.icon} ${statusInfo.text} (${statusInfo.ball} ball)`,
              callback_data: 'task_graded',
            },
          ],
        ],
      });
    } catch (error) { }

    await this.notifyTaskResult(studentUserId, lesson, statusInfo);
  }

  private async notifyTaskResult(
    studentUserId: number,
    lesson: any,
    statusInfo: { text: string; icon: string; ball: number },
  ): Promise<void> {
    const parents = await this.botChildRepo.findAll({
      where: { student_id: studentUserId },
    });
    if (!parents.length) return;

    let student: any;
    try {
      student = await this.userService.getById(studentUserId);
    } catch (error) { }

    const studentName =
      [student?.name, student?.surname].filter(Boolean).join(' ') ||
      "O'quvchi";

    const text =
      `${statusInfo.icon} <b>Vazifa natijasi</b>\n\n` +
      `👤 O'quvchi: <b>${studentName}</b>\n` +
      (lesson?.course?.title
        ? `📚 Kurs: <b>${lesson.course.title}</b>\n`
        : '') +
      `📖 Dars: <b>${lesson?.title || ''}</b>\n` +
      `📌 Holat: <b>${statusInfo.text}</b>\n` +
      `🏆 Ball: <b>${statusInfo.ball}</b>`;

    for (const parent of parents) {
      await this.bot.telegram
        .sendMessage(parent.parent_bot_id, text, { parse_mode: 'HTML' })
        .catch((error) => console.log(error));
    }
  }
}