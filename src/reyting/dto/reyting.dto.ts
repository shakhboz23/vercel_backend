import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
} from 'class-validator';

export class ReytingDto {
  // @ApiProperty({
  //   example: 'https://example.com',
  //   description: 'The image of the user',
  // })
  // @IsNotEmpty()
  // @IsNumber()
  // role_id: number;

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
  @IsNotEmpty()
  @IsNumber()
  lesson_id: number;
}
