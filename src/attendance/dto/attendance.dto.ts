import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class AttendanceDto {
  @ApiProperty({
    example: 100,
    description: 'Attendance count',
  })
  @IsNotEmpty()
  @IsNumber()
  attendance: number;

   @ApiProperty({
    example: '2023-08-01T00:00:00.000Z',
    description: 'Attendance date',
  })
  @IsNotEmpty()
  @IsDateString()
  date: Date;

  @ApiProperty({
    example: '100',
    description: 'Role of user',
  })
  @IsNotEmpty()
  @IsString()
  role: string;

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
  course_id: number;
}
