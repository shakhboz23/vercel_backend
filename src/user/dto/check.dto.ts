import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CheckDto {
  @ApiProperty({
    example: 'John Smith',
    description: 'Full name of user',
  })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty({
    example: 'John Smith',
    description: 'Full name of user',
  })
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiProperty({
    example: '+998901234567',
    description: 'Phone number of user',
  })
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(4)
  @IsString()
  password: string;
}
