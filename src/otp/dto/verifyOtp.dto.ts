import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: '+998901234567',
    description: 'Phone number for verification',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '1122',
    description: 'Code for verification',
  })
  @IsNotEmpty()
  @IsString()
  @Length(4)
  code: string;
}
