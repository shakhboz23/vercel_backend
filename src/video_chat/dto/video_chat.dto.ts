import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class VideoChatDto {
  @ApiProperty({
    example: 1,
    description: 'Icon id',
  })
  @IsString()
  @IsNotEmpty()
  room: string;

  @ApiProperty({
    example: 1,
    description: 'User_id',
  })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;
}
