import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Res,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentDto } from './dto/payment.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiOperation({ summary: 'Registration a new user' })
  @Post('/create')
  async create(@Body() paymentDto: PaymentDto) {
    const data = await this.paymentService.create(paymentDto);
    return data;
  }

  // Vercel deploys as stateless serverless functions, so the @Cron jobs in
  // schedule.service.ts (which rely on a long-lived process staying warm at
  // exactly 6/7am) never actually fire in production - no Payment rows were
  // ever being generated. vercel.json's crons config hits this HTTP route
  // instead, which Vercel *does* reliably invoke on schedule.
  @ApiOperation({ summary: 'Cron: generate due monthly payments + send reminders' })
  @Get('/cron/run-daily-jobs')
  async runDailyJobs(@Headers('authorization') authorization?: string) {
    if (
      process.env.CRON_SECRET &&
      authorization !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      throw new UnauthorizedException();
    }
    await this.paymentService.generateDuePayments();
    await this.paymentService.sendPaymentReminders();
    return { statusCode: 200, message: 'ok' };
  }

  @ApiOperation({ summary: 'Get all users' })
  @Get('getByRole')
  getAll() {
    return this.paymentService.getAll();
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.paymentService.getById(id);
  }

  @ApiOperation({ summary: 'Get users with pagination' })
  @Get('pagination/:page/:limit')
  pagination(@Param('page') page: number, @Param('limit') limit: number) {
    return this.paymentService.pagination(page, limit);
  }

  @ApiOperation({ summary: 'Delete user by ID' })
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.paymentService.deleteUser(id);
  }
}
