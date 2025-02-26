import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CategoryDto {
  @ApiProperty({
    example: 'Atomlar haqida',
    description: 'Category Title',
  })
  @IsNotEmpty()
  @IsString()
  category: string;
}
