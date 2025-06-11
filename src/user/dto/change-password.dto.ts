import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'Uzbek1&t0n',
    description: 'The old password of the user',
  })
  @IsNotEmpty()
  old_password: string;

  @ApiProperty({
    example: 'Strong_pass123!',
    description: 'The new strong password of the user',
  })
  @IsNotEmpty()
  @IsString()
  new_password: string;
}
