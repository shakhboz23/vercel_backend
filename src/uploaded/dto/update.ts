import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateDto {
  @ApiProperty({
    example: false,
    description: 'is_active',
  })
  @IsOptional()
  is_active: boolean;

  @ApiProperty({
    example: 'image',
    description: 'file type',
  })
  @IsNotEmpty()
  @IsString()
  file_type: string;

  @ApiProperty({
    example: 'image',
    description: 'file type',
  })
  @IsOptional()
  file: any;

  @ApiProperty({
    example: 'image',
    description: 'file type',
  })
  @IsOptional()
  file1: any;

  @ApiProperty({
    example: 'image',
    description: 'file type',
  })
  @IsOptional()
  duration: number;
}
