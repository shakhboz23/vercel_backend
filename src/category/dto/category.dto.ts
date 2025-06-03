import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CategoryDto {
  @ApiProperty({
    example: '🧠',
    description: 'Category icon',
  })
  @IsNotEmpty()
  @IsString()
  icon: string;

  @ApiProperty({
    example: 'Atomlar haqida',
    description: 'Category Title',
  })
  @IsNotEmpty()
  @IsString()
  title: string;
}
