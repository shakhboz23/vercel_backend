import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { SubscriptionActivityStatus } from '../models/subscription_activity.models';

export class SubscriptionActivityDto {
  @ApiProperty({
    example: 'John Smith',
    description: 'Full name of subscription_activity',
  })
  @IsNotEmpty()
  @IsNumber()
  subscription_id: number;

  @ApiProperty({
    example: 1,
    description: 'course id',
  })
  @IsNotEmpty()
  @IsNumber()
  course_id: number;

  @ApiProperty({
    example: 'John Smith',
    description: 'Full name of subscription_activity',
  })
  @IsNotEmpty()
  @IsString()
  status: SubscriptionActivityStatus;

  @ApiProperty({
    example: 'John Smith',
    description: 'Full name of subscription_activity',
  })
  @IsNotEmpty()
  @IsDateString()
  date: Date;
}
