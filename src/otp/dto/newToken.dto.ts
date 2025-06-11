import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class NewTokenDto {
  @ApiProperty({
    example: 'example@gmail.com',
    description: 'Email for new token',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'xIpqa2-zocneb-tuvqan',
    description: 'Password for new token',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
