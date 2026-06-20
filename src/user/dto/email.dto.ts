import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class PhoneUserDto {
  @ApiProperty({
    example: '+998901234567',
    description: 'Phone number of student',
  })
  @IsOptional()
  @IsPhoneNumber()
  phone: string;
}
