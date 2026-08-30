import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Bot } from '../models/bot.model';
import { BotChild } from '../models/bot_child.model';
import { Group } from 'src/group/models/group.models';
import { BOT_NAME, TASK_GROUP_ID } from '../../app.constants';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Markup, Telegraf, Input } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { UserService } from 'src/user/user.service';
import { CourseService } from 'src/course/course.service';
import { LessonService } from 'src/lesson/lesson.service';
import { TestsService } from 'src/test/test.service';
import { ReytingService } from 'src/reyting/reyting.service';
import { TASK_STEP } from './bot-onboarding.service';

interface TaskMediaEntry {
  type: 'photo' | 'document' | 'video';
  fileId: string;
  caption?: string;
}

// Handles the lesson browsing flow (lesson list, lock checks, lesson detail),
// the test hand-off, and the whole homework/task submission + grading flow
// (text or media submissions, grouping a media album, notifying the grader
// group, and notifying the student/parents once graded). Extracted out of
// BotService, which keeps thin delegating wrappers.
@Injectable()
export class BotLessonsService {
  constructor(
    @InjectModel(Bot) private botRepo: typeof Bot,
    @InjectModel(BotChild) private botChildRepo: typeof BotChild,
    @InjectModel(Group) private groupRepo: typeof Group,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>,
    private readonly userService: UserService,
    private readonly courseService: CourseService,
    private readonly lessonService: LessonService,
    @Inject(forwardRef(() => TestsService))
    private readonly testsService: TestsService,
    @Inject(forwardRef(() => ReytingService))
    private readonly reytingService: ReytingService,
  ) {}

  async getPublishedLessonsSorted(courseId: number): Promise<any[]> {
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
      await ctx.answerCbQuery('❌ Siz hali oldingi testni yechmagansiz!', {
        show_alert: true,
      });
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

    const taskButtons = await this.buildTaskButtons(lesson.id, user.user_id);

    const buttons = isCompleted
      ? [taskButtons]
      : [
          [
            {
              text: 'Test yechish',
              callback_data: `lesson_test_${lesson.id}`,
            },
            ...taskButtons,
          ],
        ];

    await ctx.reply(`📚 Dars: ${lesson.title}`, {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  // Returns the row of task-related buttons shown to a student for a lesson:
  // "Vazifa yuborish" if nothing submitted yet, "Tekshirilmoqda" while pending
  // admin review, or the final grade (with a resend option if graded "none").
  private async buildTaskButtons(lessonId: number, studentUserId: number) {
    const taskReyting = await this.reytingService.getTaskStatus(
      studentUserId,
      lessonId,
    );

    if (!taskReyting) {
      return [
        { text: 'Vazifa yuborish', callback_data: `lesson_task_${lessonId}` },
      ];
    }

    if (!taskReyting.is_finished) {
      return [{ text: '🕐 Tekshirilmoqda', callback_data: 'task_pending' }];
    }

    const statusKey =
      (
        Object.keys(this.taskStatusLabels) as Array<'full' | 'partial' | 'none'>
      ).find((key) => this.taskStatusLabels[key].ball === taskReyting.ball) ||
      'none';
    const statusInfo = this.taskStatusLabels[statusKey];

    const buttons = [
      {
        text: `${statusInfo.icon} ${statusInfo.text} (${statusInfo.ball} ball)`,
        callback_data: 'task_graded',
      },
    ];

    if (statusKey === 'none') {
      buttons.push({
        text: '🔁 Qayta yuborish',
        callback_data: `lesson_task_${lessonId}`,
      });
    }

    return buttons;
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

    const buttons = [
      [
        {
          text: 'Test yechish',
          callback_data: `lesson_test_${tests.id}`,
        },
        {
          text: 'Vazifa yuborish',
          callback_data: `lesson_task_${tests.id}`,
        },
      ],
    ];

    const pdfUrl: string = tests.test?.[0]?.question;
    const fileName = `${(tests.lesson?.title || 'test').replace(/[\\/:*?"<>|]/g, '').trim() || 'test'}.pdf`;

    await ctx.replyWithDocument(Input.fromURLStream(pdfUrl, fileName), {
      caption: `Testni yechib bo'lgach javoblarni "Test javoblarini yuborish" tugmasi orqali yuborishingiz mumkin`,
    });

    await ctx.reply(
      'Test javoblarini yuborish:',
      Markup.inlineKeyboard([
        Markup.button.webApp(
          'Academic Success Hub',
          `https://www.ashacademy.uz/test/${lessonId}?pdf=true`,
        ),
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

    const taskReyting = await this.reytingService.getTaskStatus(
      user.user_id,
      lessonId,
    );

    if (taskReyting) {
      if (!taskReyting.is_finished) {
        await ctx.reply(
          '⏳ Vazifangiz allaqachon yuborilgan, tekshirilmoqda. Natijasini kuting.',
        );
        return;
      }

      if (taskReyting.ball !== this.taskStatusLabels.none.ball) {
        await ctx.reply('✅ Vazifangiz allaqachon baholangan.');
        return;
      }
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
    } catch (error) {}

    let lesson: any;
    try {
      lesson = await this.lessonService.getById(lessonId);
    } catch (error) {}

    let groupTitle = '';
    const groupId = lesson?.course?.group_id;
    if (groupId) {
      try {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        groupTitle = group?.title || '';
      } catch (error) {}
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

    const { header, courseId } = await this.buildTaskInfo(botUser, lessonId);

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
      await this.reytingService.markTaskPending(
        botUser.user_id,
        lessonId,
        courseId,
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
        await this.sendTaskMedia(botUser, lessonId, [
          { type, fileId, caption },
        ]);
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
    const { header, courseId } = await this.buildTaskInfo(botUser, lessonId);
    const captionText = entries.find((entry) => entry.caption)?.caption;
    const fullCaption = captionText ? `${header}\n\n${captionText}` : header;
    const buttons = this.taskStatusButtons(lessonId, botUser.user_id);

    // Telegram doesn't allow mixing documents with photos/videos in one album,
    // so send visual media and documents as separate groups.
    const visualEntries = entries.filter((entry) => entry.type !== 'document');
    const documentEntries = entries.filter(
      (entry) => entry.type === 'document',
    );
    const groups = [visualEntries, documentEntries].filter(
      (group) => group.length > 0,
    );

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
          await this.bot.telegram.sendPhoto(
            TASK_GROUP_ID,
            entry.fileId,
            options,
          );
        } else if (entry.type === 'video') {
          await this.bot.telegram.sendVideo(
            TASK_GROUP_ID,
            entry.fileId,
            options,
          );
        } else {
          await this.bot.telegram.sendDocument(
            TASK_GROUP_ID,
            entry.fileId,
            options,
          );
        }
      } else {
        const media = group.map((entry, idx) => ({
          type: entry.type,
          media: entry.fileId,
          ...(idx === 0 && caption
            ? { caption, parse_mode: 'HTML' as const }
            : {}),
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

    await this.reytingService.markTaskPending(
      botUser.user_id,
      lessonId,
      courseId,
    );
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
    } catch (error) {}

    if (!lesson) {
      await ctx.answerCbQuery('Dars topilmadi', { show_alert: true });
      return;
    }

    try {
      await this.reytingService.setTaskResult(
        studentUserId,
        lessonId,
        lesson.course_id,
        statusInfo.ball,
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
    } catch (error) {}

    await this.notifyStudentTaskResult(studentUserId, lessonId, statusInfo);
    await this.notifyTaskResult(studentUserId, lesson, statusInfo);
  }

  private async notifyStudentTaskResult(
    studentUserId: number,
    lessonId: number,
    statusInfo: { text: string; icon: string; ball: number },
  ): Promise<void> {
    const studentBot = await this.botRepo.findOne({
      where: { user_id: studentUserId },
    });
    if (!studentBot) return;

    const buttons = await this.buildTaskButtons(lessonId, studentUserId);

    await this.bot.telegram
      .sendMessage(
        studentBot.bot_id,
        `${statusInfo.icon} <b>Vazifa natijasi:</b> ${statusInfo.text} (${statusInfo.ball} ball)`,
        {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [buttons] },
        },
      )
      .catch((error) => console.log(error));
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
    } catch (error) {}

    const studentName =
      [student?.name, student?.surname].filter(Boolean).join(' ') || "O'quvchi";

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
