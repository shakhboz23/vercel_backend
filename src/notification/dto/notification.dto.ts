import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class NotificationDto {
  @ApiProperty({
    example: 'student',
    description: 'notification type',
  })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({
    example: 1,
    description: 'User id',
  })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty({
    example: false,
    description: 'read',
    required: false, 
  })
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;

  @ApiProperty({
    example: false,
    description: 'accepted',
    required: false, 
  })
  @IsOptional()
  @IsBoolean()
  is_accepted?: boolean;
}
