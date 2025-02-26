import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: '+998901234567',
    description: 'Phone number for verification',
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
}
