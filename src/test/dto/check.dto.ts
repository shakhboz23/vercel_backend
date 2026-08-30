import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class CheckDto {
  @ApiProperty({
    example: [[1, '5 proton, 4 elektron']],
    description: 'Answers of the test',
  })
  @IsNotEmpty()
  @IsArray()
  answers: string[] | number[] | any[];
}
