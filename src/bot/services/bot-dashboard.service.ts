import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Bot } from '../models/bot.model';
import { Context, Markup } from 'telegraf';
import { UserService } from 'src/user/user.service';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';

// Handles the logged-in student's self-service dashboard: overall statistics,
// attendance summaries, profile info, course/reyting listings. Extracted out
// of BotService, which keeps thin delegating wrappers.
@Injectable()
export class BotDashboardService {
  constructor(
    @InjectModel(Bot) private botRepo: typeof Bot,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
    private readonly userService: UserService,
  ) {}

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
    } catch (error) {}

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
    } catch (error) {}

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

  async childStatisticsForGroup(
    ctx: Context,
    student_id: number,
    group_id: number,
  ) {
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
      subscriptions = await this.subscriptionsService.getByUserId(
        botUser.user_id,
      );
    } catch (error) {}

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
      subscriptions = await this.subscriptionsService.getByUserId(
        botUser.user_id,
      );
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
        botUser.user_id,
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

    const roleLabel =
      this.roleLabels[user.current_role] ||
      user.current_role ||
      "ko'rsatilmagan";

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

  async getUserGroups(user_id: number): Promise<Map<number, string>> {
    let subscriptions: any;
    try {
      subscriptions = await this.subscriptionsService.getByUserId(user_id);
    } catch (error) {}

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
    'Yanvar',
    'Fevral',
    'Mart',
    'Aprel',
    'May',
    'Iyun',
    'Iyul',
    'Avgust',
    'Sentabr',
    'Oktabr',
    'Noyabr',
    'Dekabr',
  ];

  private statusIcon(status: string): string {
    if (status === "ko'tarildi" || status === 'oshdi' || status === 'yangi')
      return '📈';
    if (status === 'tushdi' || status === 'kamaydi') return '📉';
    return '➖';
  }

  async sendStatistics(ctx: Context, user_id: number, group_id: number) {
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
    } catch (error) {}

    if (!courses?.length) {
      await ctx.reply('Sizda hozircha kurslar mavjud emas.');
      return;
    }

    const buttons = courses.map((subscription) => {
      const course = subscription.dataValues.course;

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
}
