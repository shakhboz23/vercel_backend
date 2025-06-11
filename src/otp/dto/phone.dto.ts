import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class PhoneDto {
  @ApiProperty({
    example: 'example@gmail.com',
    description: 'Email of user',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
