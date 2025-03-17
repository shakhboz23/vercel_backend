import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class LikeDto {
  @ApiProperty({
    example: 1,
    description: 'Course id',
  })
  @IsNotEmpty()
  @IsNumber()
  lesson_id: number;
}
