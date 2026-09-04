import { Injectable, OnModuleInit } from '@nestjs/common';
import { BOT_NAME } from '../app.constants';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';
import { Bot } from './models/bot.model';
import { InjectModel } from '@nestjs/sequelize';
import {
  CHILD_ID_STEP,
  NAME_STEP,
  SURNAME_STEP,
  PASSWORD_STEP,
  TASK_STEP,
} from './services/bot-onboarding.service';
import { BotOnboardingService } from './services/bot-onboarding.service';
import { BotNotificationsService } from './services/bot-notifications.service';
import { BotDashboardService } from './services/bot-dashboard.service';
import { BotLessonsService } from './services/bot-lessons.service';
import { BotChildrenService } from './services/bot-children.service';

// BotService is the facade the rest of the app (BotUpdate's Telegraf
// handlers, and other modules that need to push a Telegram notification)
// talks to. The actual logic lives in the focused services under
// ./services/ — this class just wires them together and preserves the flat
// public API that existed here before the split, so no caller had to change.
@Injectable()
export class BotService implements OnModuleInit {
  constructor(
    @InjectModel(Bot) private botRepo: typeof Bot,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>,
    private readonly onboarding: BotOnboardingService,
    private readonly notifications: BotNotificationsService,
    private readonly dashboard: BotDashboardService,
    private readonly lessonsService: BotLessonsService,
    private readonly childrenService: BotChildrenService,
  ) {}

  async onModuleInit() {
    try {
      await this.bot.telegram.setMyCommands([
        { command: 'start', description: 'Botni boshlash' },
      ]);

      if (process.env.NODE_ENV === 'production') {
        const webhookUrl = 'https://api.ashacademy.uz/api/webhook/bot';
        await this.bot.telegram.setWebhook(webhookUrl);
        console.log(`Webhook registered at: ${webhookUrl}`);
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Handle incoming updates
  async handleUpdate(update: any): Promise<void> {
    try {
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
        ['Statistika', 'Kurslar'],
        ['Reyting', 'Davomat'],
        ['Profil'],
      ])
        .oneTime()
        .resize(),
    };
  }

  async handleText(ctx: Context) {
    const bot_id = ctx.from.id;

    const botUser = await this.botRepo.findOne({ where: { bot_id } });

    if (botUser?.step && ctx.message && 'text' in ctx.message) {
      switch (botUser.step) {
        case CHILD_ID_STEP:
          return this.childrenService.saveChild(ctx);
        case NAME_STEP:
          return this.onboarding.setName(ctx);
        case SURNAME_STEP:
          return this.onboarding.setSurname(ctx);
        case PASSWORD_STEP:
          return this.onboarding.setPassword(ctx);
        case TASK_STEP:
          return this.lessonsService.submitTaskText(ctx, botUser);
      }
    }

    await ctx.reply(`Noto'g'ri ma'lumot!`);
  }

  // --- Onboarding / registration wizard ---

  async start(ctx: Context) {
    return this.onboarding.start(ctx);
  }

  async askRole(ctx: Context) {
    return this.onboarding.askRole(ctx);
  }

  async setRole(ctx: Context, role: 'parent' | 'student') {
    return this.onboarding.setRole(ctx, role);
  }

  async continueAfterRole(ctx: Context) {
    return this.onboarding.continueAfterRole(ctx);
  }

  async handlePhone(ctx: Context) {
    return this.onboarding.handlePhone(ctx);
  }

  async askName(ctx: Context) {
    return this.onboarding.askName(ctx);
  }

  async askSurname(ctx: Context) {
    return this.onboarding.askSurname(ctx);
  }

  async handlePassword(ctx: Context) {
    return this.onboarding.handlePassword(ctx);
  }

  async onContact(ctx: Context) {
    return this.onboarding.onContact(ctx);
  }

  async setPassword(ctx: Context) {
    return this.onboarding.setPassword(ctx);
  }

  async setName(ctx: Context) {
    return this.onboarding.setName(ctx);
  }

  async setSurname(ctx: Context) {
    return this.onboarding.setSurname(ctx);
  }

  async onStop(ctx: Context) {
    return this.onboarding.onStop(ctx);
  }

  async sendOTP(phone: string, OTP: string): Promise<boolean> {
    return this.onboarding.sendOTP(phone, OTP);
  }

  // --- Notifications pushed from other modules ---

  async notifyPaymentDue(
    user_id: number,
    courseTitle: string,
    amount: number,
    dueDate: Date,
  ): Promise<void> {
    return this.notifications.notifyPaymentDue(
      user_id,
      courseTitle,
      amount,
      dueDate,
    );
  }

  async notifyPaymentReceived(
    user_id: number,
    courseTitle: string,
    amountPaid: number,
    remainingDebt: number,
  ): Promise<void> {
    return this.notifications.notifyPaymentReceived(
      user_id,
      courseTitle,
      amountPaid,
      remainingDebt,
    );
  }

  async notifyContentAdded(
    user_id: number,
    courseTitle: string,
    lessonTitle: string,
    kind: 'vazifa' | 'test',
  ): Promise<void> {
    return this.notifications.notifyContentAdded(
      user_id,
      courseTitle,
      lessonTitle,
      kind,
    );
  }

  async notifyUnsubmitted(
    user_id: number,
    courseTitle: string,
    lessonTitle: string,
    kind: 'vazifa' | 'test',
  ): Promise<void> {
    return this.notifications.notifyUnsubmitted(
      user_id,
      courseTitle,
      lessonTitle,
      kind,
    );
  }

  async notifySubscriptionAdded(
    user_id: number,
    courseTitle: string,
  ): Promise<void> {
    return this.notifications.notifySubscriptionAdded(user_id, courseTitle);
  }

  async notifyAttendance(
    user_id: number,
    courseTitle: string,
    status: number,
  ): Promise<void> {
    return this.notifications.notifyAttendance(user_id, courseTitle, status);
  }

  async notifyRatingChanged(
    user_id: number,
    courseTitle: string,
    reasonText: string,
    newBall: number,
    ballDifference: number,
  ): Promise<void> {
    return this.notifications.notifyRatingChanged(
      user_id,
      courseTitle,
      reasonText,
      newBall,
      ballDifference,
    );
  }

  async notifyTestResult(
    user_id: number,
    lessonTitle: string,
    ball: number,
    total: number,
    questionResults: {
      isCorrect: boolean;
      selectedLabel: string;
      correctLabel: string;
    }[],
  ): Promise<void> {
    return this.notifications.notifyTestResult(
      user_id,
      lessonTitle,
      ball,
      total,
      questionResults,
    );
  }

  // --- Student dashboard: statistics, attendance, profile, courses, reyting ---

  async reyting_courses(ctx: Context) {
    return this.dashboard.reyting_courses(ctx);
  }

  async courseReyting(ctx: Context, course_id: number) {
    return this.dashboard.courseReyting(ctx, course_id);
  }

  async statistics(ctx: Context) {
    return this.dashboard.statistics(ctx);
  }

  async statisticsForGroup(ctx: Context, group_id: number) {
    return this.dashboard.statisticsForGroup(ctx, group_id);
  }

  async childStatisticsForGroup(
    ctx: Context,
    student_id: number,
    group_id: number,
  ) {
    return this.dashboard.childStatisticsForGroup(ctx, student_id, group_id);
  }

  async attendance(ctx: Context) {
    return this.dashboard.attendance(ctx);
  }

  async attendanceGroupCourses(ctx: Context, group_id: number) {
    return this.dashboard.attendanceGroupCourses(ctx, group_id);
  }

  async attendanceForCourse(ctx: Context, course_id: number) {
    return this.dashboard.attendanceForCourse(ctx, course_id);
  }

  async profile(ctx: Context) {
    return this.dashboard.profile(ctx);
  }

  async my_courses(ctx: Context) {
    return this.dashboard.my_courses(ctx);
  }

  // --- Lessons, tests and task submission/grading ---

  async lessons(ctx: Context, courseId: number) {
    return this.lessonsService.lessons(ctx, courseId);
  }

  async lessonLocked(ctx: Context, lessonId: number) {
    return this.lessonsService.lessonLocked(ctx, lessonId);
  }

  async lessonInfo(ctx: Context, lessonId: number) {
    return this.lessonsService.lessonInfo(ctx, lessonId);
  }

  async lessonTest(ctx: Context, lessonId: number) {
    return this.lessonsService.lessonTest(ctx, lessonId);
  }

  async lessonTask(ctx: Context, lessonId: number) {
    return this.lessonsService.lessonTask(ctx, lessonId);
  }

  async submitTaskText(ctx: Context, botUser: Bot) {
    return this.lessonsService.submitTaskText(ctx, botUser);
  }

  async handleMedia(ctx: Context) {
    return this.lessonsService.handleMedia(ctx);
  }

  async gradeTask(
    ctx: Context,
    status: 'full' | 'partial' | 'none',
    lessonId: number,
    studentUserId: number,
  ) {
    return this.lessonsService.gradeTask(ctx, status, lessonId, studentUserId);
  }

  // --- Parent/child linking ---

  async my_children(ctx: Context) {
    return this.childrenService.my_children(ctx);
  }

  async askChildId(ctx: Context) {
    return this.childrenService.askChildId(ctx);
  }

  async saveChild(ctx: Context) {
    return this.childrenService.saveChild(ctx);
  }

  async childInfo(ctx: Context, student_id: number) {
    return this.childrenService.childInfo(ctx, student_id);
  }

  async childResults(ctx: Context, student_id: number) {
    return this.childrenService.childResults(ctx, student_id);
  }

  async childAttendance(ctx: Context, id: number) {
    return this.childrenService.childAttendance(ctx, id);
  }

  async childAttendanceGroupCourses(
    ctx: Context,
    id: number,
    group_id: number,
  ) {
    return this.childrenService.childAttendanceGroupCourses(ctx, id, group_id);
  }

  async childAttendanceForCourse(ctx: Context, id: number, course_id: number) {
    return this.childrenService.childAttendanceForCourse(ctx, id, course_id);
  }

  async childTasks(ctx: Context, student_id: number) {
    return this.childrenService.childTasks(ctx, student_id);
  }

  async childTasksForCourse(
    ctx: Context,
    student_id: number,
    course_id: number,
  ) {
    return this.childrenService.childTasksForCourse(ctx, student_id, course_id);
  }
}
