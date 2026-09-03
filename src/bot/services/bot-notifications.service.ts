import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Bot } from '../models/bot.model';
import { BotChild } from '../models/bot_child.model';
import { BOT_NAME } from '../../app.constants';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { UserService } from 'src/user/user.service';

// Sends the outbound Telegram notifications the bot pushes to students and
// parents in response to events happening elsewhere in the app (payments,
// subscriptions, attendance, rating changes, test results). Extracted out of
// BotService, which keeps thin delegating wrappers for these methods so the
// rest of the app's call sites (payment.service.ts, reyting.service.ts,
// attendance.service.ts, test.service.ts, subscriptions.service.ts) don't
// need to change.
@Injectable()
export class BotNotificationsService {
  constructor(
    @InjectModel(Bot) private botRepo: typeof Bot,
    @InjectModel(BotChild) private botChildRepo: typeof BotChild,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>,
    private readonly userService: UserService,
  ) {}

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

  async notifyPaymentReceived(
    user_id: number,
    courseTitle: string,
    amountPaid: number,
    remainingDebt: number,
  ): Promise<void> {
    const text =
      `✅ <b>To'lov qabul qilindi!</b>\n\n` +
      `"<b>${courseTitle}</b>" kursi bo'yicha to'lov qabul qilindi.\n\n` +
      `💰 To'landi: <b>${amountPaid.toLocaleString('ru-RU')} so'm</b>\n` +
      (remainingDebt > 0
        ? `📌 Qolgan qarz: <b>${remainingDebt.toLocaleString('ru-RU')} so'm</b>`
        : `🎉 Oylik to'lov to'liq amalga oshirildi.`);

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

  private readonly attendanceStatusLabels: Record<
    number,
    { text: string; icon: string }
  > = {
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
    } catch (error) {}

    const studentName =
      [student?.name, student?.surname].filter(Boolean).join(' ') || "O'quvchi";
    const statusInfo = this.attendanceStatusLabels[status] || {
      text: "noma'lum",
      icon: 'ℹ️',
    };

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

  async notifyRatingChanged(
    user_id: number,
    courseTitle: string,
    reasonText: string,
    newBall: number,
    ballDifference: number,
  ): Promise<void> {
    let student: any;
    try {
      student = await this.userService.getById(user_id);
    } catch (error) {}

    const studentName =
      [student?.name, student?.surname].filter(Boolean).join(' ') || "O'quvchi";
    const isIncrease = ballDifference > 0;
    const icon = isIncrease ? '📈' : '📉';
    const diffText = `${isIncrease ? '+' : ''}${ballDifference}`;

    const text =
      `${icon} <b>Reyting yangilandi</b>\n\n` +
      `👤 O'quvchi: <b>${studentName}</b>\n` +
      `📚 Kurs: <b>${courseTitle}</b>\n` +
      `📌 Sabab: <b>${reasonText}</b>\n` +
      `O'zgarish: <b>${diffText} ball</b>\n` +
      `🏆 Joriy ball: <b>${newBall}</b>`;

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

  private escapeHtml(text: string): string {
    return (text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
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
    const studentBot = await this.botRepo.findOne({ where: { user_id } });
    if (!studentBot?.status) return;

    let text =
      `📝 <b>Test natijasi</b>\n\n` +
      (lessonTitle ? `📚 Dars: <b>${this.escapeHtml(lessonTitle)}</b>\n` : '') +
      `✅ Natija: <b>${ball}/${total}</b>\n\n`;

    text += questionResults
      .map((item, index) => {
        const selected = this.escapeHtml(item.selectedLabel) || '—';
        if (item.isCorrect) {
          return `${index + 1}. ${selected}✅`;
        }
        return `${index + 1}. ${selected}❌${this.escapeHtml(item.correctLabel)}`;
      })
      .join('\n');

    await this.bot.telegram
      .sendMessage(studentBot.bot_id, text, { parse_mode: 'HTML' })
      .catch((error) => console.log(error));
  }
}
