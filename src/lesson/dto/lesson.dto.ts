import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsBooleanString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { lessonType } from '../models/lesson.models';

export class LessonDto {
  @ApiProperty({
    example: 'Title',
    description: 'Lesson title',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 1,
    description: 'Course id',
  })
  @IsNotEmpty()
  @IsNumberString()
  course_id: number;

  
  @ApiProperty({
    example: 1,
    description: 'Course id',
  })
  @IsOptional()
  // @IsNumberString()
  lesson_id: number;

  @ApiProperty({
    example: false,
    description: 'Lesson type',
  })
  @IsOptional()
  @IsBooleanString()
  published?: boolean;

  @ApiProperty({
    example: '<p>Content</p>',
    description: 'Video content',
  })
  @IsOptional()
  @IsString()
  content: string;

  @ApiProperty({
    example: '<p>Content</p>',
    description: 'Video content',
  })
  @IsOptional()
  // @IsString()
  youtube?: string;

  @ApiProperty({
    example: 'Title',
    description: 'Lesson title',
  })
  @IsNotEmpty()
  @IsEnum(lessonType)
  type: lessonType;
}
