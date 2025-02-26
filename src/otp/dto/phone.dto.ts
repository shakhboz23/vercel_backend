import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class PhoneDto {
  @ApiProperty({
    example: '+998901234567',
    description: 'TPhone number of user',
  })
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
}
