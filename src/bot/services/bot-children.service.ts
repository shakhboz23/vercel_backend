import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Bot } from '../models/bot.model';
import { BotChild } from '../models/bot_child.model';
import { Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { User } from 'src/user/models/user.models';
import { UserService } from 'src/user/user.service';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { TestsService } from 'src/test/test.service';
import { BotOnboardingService, CHILD_ID_STEP } from './bot-onboarding.service';
import { BotDashboardService } from './bot-dashboard.service';
import { BotLessonsService } from './bot-lessons.service';

// Handles the parent/child linking flow: listing a parent's linked children,
// adding a new child by student ID, and viewing a child's info, results,
// attendance and tasks on the parent's behalf. Extracted out of BotService,
// which keeps thin delegating wrappers.
@Injectable()
export class BotChildrenService {
  constructor(
    @InjectModel(Bot) private botRepo: typeof Bot,
    @InjectModel(BotChild) private botChildRepo: typeof BotChild,
    private readonly userService: UserService,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
    @Inject(forwardRef(() => TestsService))
    private readonly testsService: TestsService,
    private readonly botOnboardingService: BotOnboardingService,
    private readonly botDashboardService: BotDashboardService,
    private readonly botLessonsService: BotLessonsService,
  ) {}

  async my_children(ctx: Context) {
    const bot_id = ctx.from.id;

    const botUser = await this.botRepo.findOne({ where: { bot_id } });

    if (!botUser) {
      return this.botOnboardingService.start(ctx);
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

    await this.botRepo.update({ step: CHILD_ID_STEP }, { where: { bot_id } });

    await ctx.reply(
      'Farzandingizning ID raqamini yuboring: 👇👇👇 \n\nMasalan: 125',
    );
  }

  async saveChild(ctx: Context) {
    const bot_id = ctx.from.id;
    const message = ctx.message as Message.TextMessage;
    const student_id = message.text.trim();

    if (!Number.isInteger(+student_id) || +student_id <= 0) {
      await ctx.reply(
        'Iltimos, faqat raqamlardan iborat ID yuboring. \n\nMasalan: 125',
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

    await this.childInfo(ctx, student.id);

    return this.my_children(ctx);
  }

  async childInfo(ctx: Context, student_id: number) {
    let student: any;
    try {
      student = await this.userService.getById(student_id);
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
    } catch (error) {}

    const course_titles = (courses || [])
      .map((subscription: any) => subscription.dataValues.course?.title)
      .filter(Boolean);

    await ctx.reply(
      `👤 <b>${student.name || ''} ${student.surname || ''}</b>\n` +
        (student.student_id ? `🆔 ID: ${student.student_id}\n` : ``) +
        `📚 Kurslar: ${course_titles.length ? course_titles.join(', ') : 'mavjud emas'}`,
      { parse_mode: 'HTML' },
    );

    await ctx.reply("Nimani ko'rmoqchisiz?", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📅 Davomat',
              callback_data: `child_attendance_${student_id}`,
            },
          ],
          [
            {
              text: '📊 Natijalar',
              callback_data: `child_results_${student_id}`,
            },
          ],
          [
            {
              text: '📝 Vazifalar',
              callback_data: `child_tasks_${student_id}`,
            },
          ],
        ],
      },
    });
  }

  async childResults(ctx: Context, student_id: number) {
    let student: any;
    try {
      student = await this.userService.getById(student_id);
    } catch (error) {}

    if (!student) {
      await ctx.reply("O'quvchi topilmadi");
      return;
    }

    const groups = await this.botDashboardService.getUserGroups(student.id);

    if (!groups.size) {
      await ctx.reply('Farzandingizda hozircha guruhlar mavjud emas.');
      return;
    }

    if (groups.size === 1) {
      const [groupId] = groups.keys();
      return this.botDashboardService.sendStatistics(ctx, student.id, groupId);
    }

    const buttons = [...groups.entries()].map(([groupId, title]) => [
      { text: title, callback_data: `child_stats_${student_id}_${groupId}` },
    ]);

    await ctx.reply("📊 Natijalarni ko'rish uchun guruhni tanlang:", {
      reply_markup: { inline_keyboard: buttons },
    });
  }

  async childAttendance(ctx: Context, id: number) {
    let student: any;
    try {
      student = await this.userService.getById(id);
    } catch (error) {}

    if (!student) {
      await ctx.reply("O'quvchi topilmadi");
      return;
    }

    const groups = await this.botDashboardService.getUserGroups(student.id);

    if (!groups.size) {
      await ctx.reply('Farzandingizda hozircha guruhlar mavjud emas.');
      return;
    }

    const buttons = [...groups.entries()].map(([groupId, title]) => [
      { text: title, callback_data: `child_attendance_group_${id}_${groupId}` },
    ]);

    await ctx.reply("📅 Davomatni ko'rish uchun guruhni tanlang:", {
      reply_markup: { inline_keyboard: buttons },
    });
  }

  async childAttendanceGroupCourses(
    ctx: Context,
    id: number,
    group_id: number,
  ) {
    let student: any;
    try {
      student = await this.userService.getById(id);
    } catch (error) {}

    if (!student) {
      await ctx.reply("O'quvchi topilmadi");
      return;
    }

    let subscriptions: any;
    try {
      subscriptions = await this.subscriptionsService.getByUserId(student.id);
    } catch (error) {}

    const courses = ((subscriptions as any[]) || [])
      .map((subscription: any) => subscription.dataValues.course)
      .filter((course: any) => course?.group_id == group_id);

    if (!courses.length) {
      await ctx.reply('Bu guruhda farzandingizning kurslari mavjud emas.');
      return;
    }

    const buttons = courses.map((course: any) => [
      {
        text: course.title,
        callback_data: `child_attendance_course_${id}_${course.id}`,
      },
    ]);

    await ctx.reply("📚 Davomatni ko'rish uchun kursni tanlang:", {
      reply_markup: { inline_keyboard: buttons },
    });
  }

  async childAttendanceForCourse(ctx: Context, id: number, course_id: number) {
    let student: any;
    try {
      student = await this.userService.getById(id);
    } catch (error) {}

    if (!student) {
      await ctx.reply("O'quvchi topilmadi");
      return;
    }

    let subscriptions: any;
    try {
      subscriptions = await this.subscriptionsService.getByUserId(student.id);
    } catch (error) {}

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
      analytics = await this.userService.getUserAnalytics(
        student.id,
        course.group_id,
      );
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

  async childTasks(ctx: Context, student_id: number) {
    let student: any;
    try {
      student = await this.userService.getById(student_id);
    } catch (error) {}

    if (!student) {
      await ctx.reply("O'quvchi topilmadi");
      return;
    }

    let courses: any;
    try {
      courses = await this.subscriptionsService.getByUserId(student.id);
    } catch (error) {}

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

  async childTasksForCourse(
    ctx: Context,
    student_id: number,
    course_id: number,
  ) {
    let student: any;
    try {
      student = await this.userService.getById(student_id);
    } catch (error) {}

    if (!student) {
      await ctx.reply("O'quvchi topilmadi");
      return;
    }

    const publishedLessons =
      await this.botLessonsService.getPublishedLessonsSorted(course_id);

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

      lines.push(
        `${isCompleted ? '✅' : isLocked ? '🔒' : '⏳'} ${lesson.title}`,
      );
      previousCompleted = isCompleted;
    }

    await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
  }
}
