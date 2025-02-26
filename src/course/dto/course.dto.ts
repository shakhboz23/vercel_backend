import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsBooleanString,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class CourseDto {
  @ApiProperty({
    example: 'Title',
    description: 'Course title',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Description',
    description: 'Course Description',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: 12,
    description: 'Course price',
  })
  @IsNotEmpty()
  @IsNumberString()
  price: number;

  @ApiProperty({
    example: 0,
    description: 'Course price',
  })
  @IsOptional()
  @IsNumberString()
  discount: number;

  @ApiProperty({
    example: 1,
    description: 'Course id',
  })
  @IsNotEmpty()
  @IsNumberString()
  group_id: number;

  @ApiProperty({
    example: 1,
    description: 'Course id',
  })
  @IsNotEmpty()
  @IsNumberString()
  category_id: number;

  @ApiProperty({
    example: false,
    description: 'Course type',
  })
  @IsOptional()
  @IsBooleanString()
  type: boolean;
}
