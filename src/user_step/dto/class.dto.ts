import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
} from 'class-validator';

export class UserStepDto {
  @ApiProperty({
    example: 1,
    description: 'lesson id',
  })
  @IsNotEmpty()
  @IsNumber()
  lesson_id: number;

  @ApiProperty({
    example: 1,
    description: 'user id',
  })
  @IsNotEmpty()
  @IsNumber()
  role_id: number;
}
