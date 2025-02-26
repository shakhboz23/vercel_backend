import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class NewPasswordDto {
  @ApiProperty({
    example: 'Uzbek1&t0n',
    description: 'The old password of the user',
  })
  @IsNotEmpty()
  new_password: string;

  @ApiProperty({
    example: 'Strong_pass123!',
    description: 'The new strong password of the user',
  })
  @IsNotEmpty()
  @IsString()
  confirm_password: string;

  @ApiProperty({
    example: 'djskdjsds-sdsdsd-sds4ds4ds4d',
    description: 'Activation link',
  })
  @IsNotEmpty()
  @IsString()
  activation_link: string;
}
