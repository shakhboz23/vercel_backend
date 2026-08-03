import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UserStreakDto {
  @ApiProperty({
    example: 5,
    description: 'Full name of user',
  })
  @IsOptional()
  @IsNumber()
  user_id: number;

  @ApiProperty({
    example: 5,
    description: 'Lesson id',
  })
  @IsOptional()
  @IsNumber()
  lesson_id: number;

  @ApiProperty({
    example: ['Mon', 'Tue', 'Wed'],
    description: 'Attendance days',
  })
  @IsOptional()
  @IsArray()
  attendance_days: string[];
}
