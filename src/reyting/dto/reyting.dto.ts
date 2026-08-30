import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { FinishedType } from '../models/reyting.models';

export class ReytingDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'full name of the user',
  })
  @IsNumber()
  @IsNumber()
  ball: number;

  @ApiProperty({
    example: true,

    description: 'new task notification for the user',
  })
  @IsOptional()
  @IsNumber()
  lesson_id?: number;

  @ApiProperty({
    example: 1,
    description: 'The course the reyting entry belongs to',
  })
  @IsOptional()
  @IsNumber()
  course_id?: number;

  @ApiProperty({
    example: FinishedType.attendance,
    description: 'Source of the reyting entry',
    enum: FinishedType,
  })
  @IsOptional()
  @IsEnum(FinishedType)
  finished_type?: FinishedType;
}
