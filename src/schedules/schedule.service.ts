import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentService } from 'src/payment/payment.service';

@Injectable()
export class MyService {
    private readonly logger = new Logger(MyService.name);

    constructor(private readonly paymentService: PaymentService) { }

    // Creates the next monthly Payment row for every subscription whose
    // billing period has come due (start_date + N months <= today).
    @Cron(CronExpression.EVERY_DAY_AT_6AM)
    async handleMonthlyPaymentGeneration() {
        try {
            await this.paymentService.generateDuePayments();
        } catch (error) {
            this.logger.error('generateDuePayments failed', error);
        }
    }

    // Reminds students and parents once a day during the last 7 days before
    // an unpaid monthly payment's due date.
    @Cron(CronExpression.EVERY_DAY_AT_7AM)
    async handlePaymentReminders() {
        try {
            await this.paymentService.sendPaymentReminders();
        } catch (error) {
            this.logger.error('sendPaymentReminders failed', error);
        }
    }
}
