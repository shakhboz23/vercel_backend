import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class GroupSearchDto {
  @ApiProperty({
    example: 'A',
    description: 'Group name',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    example: ['2023-06-01T00:00:00Z', '2024-01-01T00:00:00Z'],
    description: 'Array of creation dates',
    type: [Date],
  })
  @IsOptional()
  @IsString()
  createdAt?: string;

  @ApiProperty({
    example: 'A',
    description: 'Group name',
  })
  @IsOptional()
  @IsString()
  subcategory_id?: string;

  @ApiProperty({
    example: 'A',
    description: 'Group name',
  })
  @IsOptional()
  @IsNumberString()
  category_id?: string;

  @ApiProperty({
    example: 'A',
    description: 'Group name',
  })
  @IsOptional()
  @IsString()
  price?: string;
}
