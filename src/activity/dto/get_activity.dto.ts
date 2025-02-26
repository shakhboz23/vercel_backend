import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetActivityDto {
  @ApiProperty({
    example: '100',
    description: 'Phone number of user',
  })
  @IsNotEmpty()
  @IsDateString()
  start_time: Date;

  @ApiProperty({
    example: '100',
    description: 'Phone number of user',
  })
  @IsNotEmpty()
  @IsDateString()
  end_time: Date;

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
