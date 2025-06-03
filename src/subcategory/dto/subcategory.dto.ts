import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class SubCategoryDto {
  @ApiProperty({
    example: 'Atomlar haqida',
    description: 'SubCategory Title',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

   @ApiProperty({
    example: 1,
    description: 'SubCategory id',
  })
  @IsNotEmpty()
  @IsNumber()
  category_id: number;
}
