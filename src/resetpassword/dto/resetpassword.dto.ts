import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
} from 'class-validator';

export class ResetpasswordDto {
  @ApiProperty({
    example: 'shahbozmamatkarimov2303@gmail.com',
    description: 'email address',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
