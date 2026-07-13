import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class AttendanceDto {
  @ApiProperty({
    example: '100',
    description: 'Phone number of user',
  })
  @IsNotEmpty()
  @IsString()
  attendance: string;

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
