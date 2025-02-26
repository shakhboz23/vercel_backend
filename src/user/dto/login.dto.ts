import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginUserDto {
  // @ApiProperty({
  //   example: '+998901234567',
  //   description: 'Phone number of student',
  // })
  // @IsOptional()
  // @IsPhoneNumber()
  // phone?: string;

  @ApiProperty({
    example: '+998901234567',
    description: 'Phone number of student',
  })
  @IsOptional()
  // @IsEmail()
  email?: string;

  @ApiProperty({
    example: '1',
    description: 'Id of student',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
