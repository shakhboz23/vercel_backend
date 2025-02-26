import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';

export class CheckDto {
  @ApiProperty({
    example: [[1, '5 proton, 4 elektron']],
    description: 'Answers of the test',
  })
  @IsNotEmpty()
  @IsArray()
  answers: string[];

  // @ApiProperty({
  //   example: 1,
  //   description: 'Lesson id',
  // })
  // @IsNotEmpty()
  // @IsNumber()
  // lesson_id: number;
}
