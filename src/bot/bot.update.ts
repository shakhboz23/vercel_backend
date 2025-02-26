import { Ctx, Start, Update, On, Help, Hears } from 'nestjs-telegraf';
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

  @Hears("Telefon raqamni o'zgartirish")
  async handlePhone(@Ctx() ctx: Context) {
    return this.botService.handlePhone(ctx);
  }

  @Hears("Parolni o'zgaritish")
  async handlePassword(@Ctx() ctx: Context) {
    return this.botService.handlePassword(ctx);
  }

  @Hears(/pass:\w+/)
  async handlePasswordRegex(@Ctx() ctx: Context) {
    return this.botService.setPassword(ctx);
  }

  @On('contact')
  async onContact(@Ctx() ctx: Context) {
    return this.botService.onContact(ctx);
  }

  @On('message')
  async handleMessages(@Ctx() ctx: Context) {
    await ctx.reply(`Noto'g'ri ma'lumot!`);
  }
}
