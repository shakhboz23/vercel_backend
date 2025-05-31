import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CommentDto {
  @ApiProperty({
    example: 1,
    description: 'Lesson id',
  })
  @IsNotEmpty()
  @IsNumber()
  lesson_id: number;

  @ApiProperty({
    example: "this is very good course that I have ever watched",
    description: 'Comment',
  })
  @IsNotEmpty()
  @IsString()
  comment: string;
}
