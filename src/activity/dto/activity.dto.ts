import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ActivityDto {
  @ApiProperty({
    example: '100',
    description: 'Phone number of user',
  })
  @IsNotEmpty()
  @IsString()
  activity: string;

  @ApiProperty({
    example: '100',
    description: 'Phone number of user',
  })
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiProperty({
    example: 'John Smith',
    description: 'Full name of user',
  })
  @IsOptional()
  @IsNumber()
  user_id: number;
}
