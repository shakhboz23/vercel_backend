import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class PaymentDto {
  @ApiProperty({
    example: 5,
    description: 'Full name of user',
  })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty({
    example: 5,
    description: 'Lesson id',
  })
  @IsNotEmpty()
  @IsNumber()
  course_id: number;

  @ApiProperty({
    example: 10000,
    description: 'Payment amount',
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    example: 5,
    description:
      'Id of the specific Payment row (month) being paid off, as shown to the admin. ' +
      'When omitted, the oldest outstanding row is paid instead.',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  payment_id?: number;

  @ApiProperty({
    example: 'cash',
    description: 'Payment method',
  })
  @IsOptional()
  payment_method?: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Transaction ID',
  })
  @IsOptional()
  transaction_id?: string;

  @ApiProperty({
    example: 'Payment for course',
    description: 'Payment comment',
  })
  @IsOptional()
  comment?: string;
}
