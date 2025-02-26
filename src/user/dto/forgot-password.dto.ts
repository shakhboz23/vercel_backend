import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: '+998901234567',
    description: 'The phone number for verification',
  })
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    example: '1122',
    description: 'Code for verification',
  })
  @IsNotEmpty()
  @IsString()
  @Length(4)
  code: string;

  @ApiProperty({
    example: 'Strong_pass123!',
    description: 'The new strong password of the user',
  })
  @IsNotEmpty()
  @IsStrongPassword()
  new_password: string;

  @ApiProperty({
    example: 'Strong_pass123!',
    description: 'The confirm new strong password of the student',
  })
  @IsNotEmpty()
  confirm_new_password: string;
}
