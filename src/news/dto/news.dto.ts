import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class NewsDto {
  @ApiProperty({
    example: 'A1',
    description: 'Name of the news',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: '8-class',
    description: 'Description of the news',
  })
  @IsString()
  source: string;

  @ApiProperty({
    example: 'Monday, Wednesday, Friday',
    description: 'Weeks of the news',
  })
  @IsNotEmpty()
  @IsString()
  description: string;
}
