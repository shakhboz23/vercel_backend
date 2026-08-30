import { Ctx, Start, Update, On, Help, Hears, Action } from 'nestjs-telegraf';
import { BotService } from './bot.service';
import { Context } from 'telegraf';

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) { }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    try {
      return await this.botService.start(ctx);
    } catch (error) {
      console.error('Error in onStart:', error);
      await ctx.reply('An error occurred. Please try again later.');
    }
  }

  @Action('role_parent')
  async roleParent(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    return this.botService.setRole(ctx, 'parent');
  }

  @Action('role_student')
  async roleStudent(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    return this.botService.setRole(ctx, 'student');
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    await ctx.reply('Send me a sticker');
  }

  @On('sticker')
  async on(@Ctx() ctx: Context) {
    await ctx.reply('👍');
  }

  @Hears('hi')
  async hears(@Ctx() ctx: Context) {
    await ctx.reply('Hi');
  }

  @Hears('Statistika')
  async statistics(@Ctx() ctx: Context) {
    return this.botService.statistics(ctx);
  }

  @Hears('Reyting')
  async reyting(@Ctx() ctx: Context) {
    return this.botService.reyting_courses(ctx);
  }

  @Hears('Farzandlarim')
  async children(@Ctx() ctx: Context) {
    return this.botService.my_children(ctx);
  }

  @Hears('Kurslar')
  async courses(@Ctx() ctx: Context) {
    return this.botService.my_courses(ctx);
  }

  @Hears('Davomat')
  async attendance(@Ctx() ctx: Context) {
    return this.botService.attendance(ctx);
  }

  @Hears('Profil')
  async profile(@Ctx() ctx: Context) {
    return this.botService.profile(ctx);
  }

  @Hears("Telefon raqamni o'zgartirish")
  async handlePhone(@Ctx() ctx: Context) {
    return this.botService.handlePhone(ctx);
  }

  @Hears("Parolni o'zgaritish")
  async handlePassword(@Ctx() ctx: Context) {
    return this.botService.handlePassword(ctx);
  }

  @On('contact')
  async onContact(@Ctx() ctx: Context) {
    return this.botService.onContact(ctx);
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: Context) {
    return this.botService.handleMedia(ctx);
  }

  @On('document')
  async onDocument(@Ctx() ctx: Context) {
    return this.botService.handleMedia(ctx);
  }

  @On('video')
  async onVideo(@Ctx() ctx: Context) {
    return this.botService.handleMedia(ctx);
  }

  @On('message')
  async handleMessages(@Ctx() ctx: Context) {
    return this.botService.handleText(ctx);
  }

  @Action(/^course_(\d+)$/)
  async selectCourse(ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    const courseId = Number(callbackQuery.data.replace('course_', ''));

    return this.botService.lessons(ctx, courseId);
  }

  @Action(/^stats_group_(\d+)$/)
  async selectStatsGroup(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    await ctx.answerCbQuery();

    const groupId = Number(callbackQuery.data.replace('stats_group_', ''));

    return this.botService.statisticsForGroup(ctx, groupId);
  }

  @Action(/^attendance_group_(\d+)$/)
  async selectAttendanceGroup(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    await ctx.answerCbQuery();

    const groupId = Number(callbackQuery.data.replace('attendance_group_', ''));

    return this.botService.attendanceGroupCourses(ctx, groupId);
  }

  @Action(/^attendance_course_(\d+)$/)
  async selectAttendanceCourse(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    await ctx.answerCbQuery();

    const courseId = Number(callbackQuery.data.replace('attendance_course_', ''));

    return this.botService.attendanceForCourse(ctx, courseId);
  }

  @Action(/^reyting_course_(\d+)$/)
  async handleCourseReyting(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    const course_id = Number(callbackQuery.data.replace('reyting_course_', ''));

    return this.botService.courseReyting(ctx, course_id);
  }

  @Action(/^lesson_(\d+)$/)
  async selectLesson(ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    const lessonId = Number(callbackQuery.data.replace('lesson_', ''));

    return this.botService.lessonInfo(ctx, lessonId);
  }

  @Action(/^lesson_locked_(\d+)$/)
  async selectLockedLesson(ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    const lessonId = Number(callbackQuery.data.replace('lesson_locked_', ''));

    return this.botService.lessonLocked(ctx, lessonId);
  }

  @Action('add_child')
  async addChild(ctx: Context) {
    await ctx.answerCbQuery();

    return this.botService.askChildId(ctx);
  }

  @Action(/^child_(\d+)$/)
  async selectChild(ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    await ctx.answerCbQuery();

    const studentId = +callbackQuery.data.replace('child_', '');

    return this.botService.childInfo(ctx, studentId);
  }

  @Action(/^child_stats_(\d+)_(\d+)$/)
  async selectChildStatsGroup(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    await ctx.answerCbQuery();

    const [, studentId, groupId] = callbackQuery.data.match(/^child_stats_(\d+)_(\d+)$/) || [];

    return this.botService.childStatisticsForGroup(ctx, Number(studentId), Number(groupId));
  }

  @Action(/^child_results_(\d+)$/)
  async selectChildResults(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    await ctx.answerCbQuery();

    const studentId = callbackQuery.data.replace('child_results_', '');

    return this.botService.childResults(ctx, +studentId);
  }

  @Action(/^child_attendance_(\d+)$/)
  async selectChildAttendance(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    await ctx.answerCbQuery();

    const studentId = callbackQuery.data.replace('child_attendance_', '');

    return this.botService.childAttendance(ctx, +studentId);
  }

  @Action(/^child_attendance_group_(\d+)_(\d+)$/)
  async selectChildAttendanceGroup(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    await ctx.answerCbQuery();

    const [, studentId, groupId] = callbackQuery.data.match(/^child_attendance_group_(\d+)_(\d+)$/) || [];

    return this.botService.childAttendanceGroupCourses(ctx, +studentId, Number(groupId));
  }

  @Action(/^child_attendance_course_(\d+)_(\d+)$/)
  async selectChildAttendanceCourse(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    await ctx.answerCbQuery();

    const [, studentId, courseId] = callbackQuery.data.match(/^child_attendance_course_(\d+)_(\d+)$/) || [];

    return this.botService.childAttendanceForCourse(ctx, +studentId, Number(courseId));
  }

  @Action(/^child_tasks_(\d+)$/)
  async selectChildTasks(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    await ctx.answerCbQuery();

    const studentId = +callbackQuery.data.replace('child_tasks_', '');

    return this.botService.childTasks(ctx, studentId);
  }

  @Action(/^child_tasks_course_(\d+)_(\d+)$/)
  async selectChildTasksCourse(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    await ctx.answerCbQuery();

    const [, studentId, courseId] = callbackQuery.data.match(/^child_tasks_course_(\d+)_(\d+)$/) || [];

    return this.botService.childTasksForCourse(ctx, +studentId, Number(courseId));
  }

  @Action(/^lesson_test_(\d+)$/)
  async lessonTest(ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    const lessonId = Number(callbackQuery.data.replace('lesson_test_', ''));

    return this.botService.lessonTest(ctx, lessonId);
  }

  @Action(/^lesson_task_(\d+)$/)
  async lessonTask(ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    await ctx.answerCbQuery();

    const lessonId = Number(callbackQuery.data.replace('lesson_task_', ''));

    return this.botService.lessonTask(ctx, lessonId);
  }

  @Action('task_pending')
  async taskPending(ctx: Context) {
    await ctx.answerCbQuery('⏳ Vazifangiz hali tekshirilmoqda');
  }

  @Action('task_graded')
  async taskGraded(ctx: Context) {
    await ctx.answerCbQuery('✅ Vazifa allaqachon baholangan');
  }

  @Action(/^task_status_(full|partial|none)_(\d+)_(\d+)$/)
  async gradeTask(ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!('data' in callbackQuery)) {
      return;
    }

    const [, status, lessonId, studentUserId] =
      callbackQuery.data.match(/^task_status_(full|partial|none)_(\d+)_(\d+)$/) || [];

    if (!status) {
      return;
    }

    return this.botService.gradeTask(
      ctx,
      status as 'full' | 'partial' | 'none',
      Number(lessonId),
      Number(studentUserId),
    );
  }
}
