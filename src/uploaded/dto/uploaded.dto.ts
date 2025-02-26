import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class UploadedDto {
  @ApiProperty({
    example: 'image',
    description: 'file type',
  })
  @IsOptional()
  @IsString()
  file_type?: string;

  @ApiProperty({
    example: 'https://example.com',
    description: 'file url',
  })
  @IsOptional()
  @IsUrl()
  file_url?: string;

  @ApiProperty({
    example: 'image',
    description: 'file type',
  })
  @IsOptional()
  duration?: number;
}
