import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class SearchChildDto {
  @ApiProperty({
    example: 'John Smith',
    description: 'Full name of user',
  })
  @IsNotEmpty()
  @IsNumber()
  parent_id: number;

  @ApiProperty({
    example: 'John Smith',
    description: 'Full name of user',
  })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty({
    example: '+998901234567',
    description: 'Phone number of user',
  })
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    example: [['1', 'A']],
    description: 'Classes of the user',
  })
  @IsNotEmpty()
  @IsArray()
  class: string[][];

  @ApiProperty({
    example: 'Samarkand',
    description: 'Region name of user',
  })
  @IsNotEmpty()
  @IsString()
  region: string;

  @ApiProperty({
    example: 'Kattakhurgan',
    description: 'District name of user',
  })
  @IsNotEmpty()
  @IsString()
  district: string;

  @ApiProperty({
    example: '25',
    description: 'School number of user',
  })
  @IsNotEmpty()
  @IsNumber()
  school_number: number;
}
