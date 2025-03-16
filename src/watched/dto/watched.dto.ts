import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class WatchedDto {
  @ApiProperty({
    example: 1,
    description: 'lesson id',
  })
  @IsOptional()
  @IsNumber()
  lesson_id?: number;

  @ApiProperty({
    example: 1,
    description: 'course id',
  })
  @IsOptional()
  @IsNumber()
  course_id?: number;

  @ApiProperty({
    example: 1,
    description: 'group id',
  })
  @IsOptional()
  @IsNumber()
  group_id?: number;  
}
