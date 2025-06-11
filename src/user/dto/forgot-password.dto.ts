import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: '1122',
    description: 'Activation link for verification',
  })
  @IsNotEmpty()
  @IsString()
  activation_link: string;

  @ApiProperty({
    example: 'Strong_pass123!',
    description: 'The new strong password of the user',
  })
  @IsNotEmpty()
  @IsString()
  new_password: string;
}
