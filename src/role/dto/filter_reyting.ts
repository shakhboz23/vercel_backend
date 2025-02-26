import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class RoleReytingDto {
  @ApiProperty({
    example: 1,
    description: 'Subject id',
  })
  @IsOptional()
  subject_id: number;

  @ApiProperty({
    example: [['1', 'A']],
    description: 'Classes of the user',
  })
  @IsOptional()
  class: string[][];

  @ApiProperty({
    example: 'Samarkand',
    description: 'Region name of user',
  })
  @IsOptional()
  region: string;

  @ApiProperty({
    example: 'Kattakhurgan',
    description: 'District name of user',
  })
  @IsOptional()
  district: string;

  @ApiProperty({
    example: '25',
    description: 'School number of user',
  })
  @IsOptional()
  school_number: number;
}
