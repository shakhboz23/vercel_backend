import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ChatDto {
  @ApiProperty({
    example: 'https://example.com',
    description: 'Image url',
  })
  @IsOptional()
  file: string;

  @ApiProperty({
    example: 'Assalamu alaikum',
    description: 'User message',
  })
  @IsOptional()
  text: string;

  @ApiProperty({
    example: 1,
    description: 'chatgroup_id',
  })
  @IsNotEmpty()
  chatgroup_id: number;
}
