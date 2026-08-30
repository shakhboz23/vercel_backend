import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RoleDto {
  @ApiProperty({
    example: 'John Smith',
    description: 'Full name of user',
  })
  @IsOptional()
  user_id?: number;

  @ApiProperty({
    example: 'student',
    description: 'Role of user',
  })
  @IsNotEmpty()
  @IsString()
  role: string;
}
