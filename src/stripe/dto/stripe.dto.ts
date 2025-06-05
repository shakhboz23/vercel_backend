import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class StripeDto {
  @ApiProperty({
    example: 1,
    description: 'CourseID',
  })
  @IsNotEmpty()
  @IsNumber()
  course_id: number;

  @ApiProperty({
    example: 2,
    description: 'Amount',
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
