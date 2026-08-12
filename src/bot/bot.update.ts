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

  @Help()
  async help(@Ctx() ctx: Context) {
    console.log(ctx);
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
    await ctx.reply('working...');
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
    // await ctx.reply('working...');
    return this.botService.my_courses(ctx);
  }

  @Hears('Davomat')
  async attendance(@Ctx() ctx: Context) {
    await ctx.reply('working...');
  }

  @Hears("Telefon raqamni o'zgartirish")
  async handlePhone(@Ctx() ctx: Context) {
    return this.botService.handlePhone(ctx);
  }

  @Hears("Parolni o'zgaritish")
  async handlePassword(@Ctx() ctx: Context) {
    return this.botService.handlePassword(ctx);
  }

  @Hears(/pass:\w+/i)
  async handlePasswordRegex(@Ctx() ctx: Context) {
    return this.botService.setPassword(ctx);
  }

  @Hears(/ism:\w+/i)
  async handleNameRegex(@Ctx() ctx: Context) {
    return this.botService.setName(ctx);
  }

  @Hears(/familiya:\w+/i)
  async handleSurnameRegex(@Ctx() ctx: Context) {
    return this.botService.setSurname(ctx);
  }

  @On('contact')
  async onContact(@Ctx() ctx: Context) {
    return this.botService.onContact(ctx);
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

    const studentId = Number(callbackQuery.data.replace('child_', ''));

    return this.botService.childInfo(ctx, studentId);
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
}
