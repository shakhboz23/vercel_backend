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
    description: 'Course id',
  })
  @IsOptional()
  @IsNumber()
  course_id?: number;

  @ApiProperty({
    example: 1,
    description: 'Attendance',
  })
  @IsOptional()
  @IsNumber()
  attendance?: number;

  @ApiProperty({
    example: ['Mon', 'Tue', 'Wed'],
    description: 'Attendance days',
  })
  @IsOptional()
  @IsArray()
  attendance_days: string[];
}
