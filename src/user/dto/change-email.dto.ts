import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';

export class ChangeUserEmailDto {
  @ApiProperty({
    example: '4568',
    description: 'Otp',
  })
  @IsNotEmpty()
  @IsString()
  @Length(4)
  code: string;

  @ApiProperty({
    example: 'example@gmail.com',
    description: 'Email of user',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password',
    description: 'Password',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
