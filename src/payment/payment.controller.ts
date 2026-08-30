import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentDto } from './dto/payment.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
  ) {}

  @ApiOperation({ summary: 'Registration a new user' })
  @Post('/create')
  async create(
    @Body() paymentDto: PaymentDto,
  ) {
    const data = await this.paymentService.create(paymentDto);
    return data;
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
