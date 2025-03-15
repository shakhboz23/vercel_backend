import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { RoleDto } from '../../role/dto/role.dto';

export class RegisterUserDto extends RoleDto {
  @ApiProperty({
    example: 'John',
    description: 'Name of user',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Smith',
    description: 'Surname of user',
  })
  @IsNotEmpty()
  @IsString()
  surname: string;

  @ApiProperty({
    example: true,
    description: 'Is active of user',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    example: 'shahbozmamatkarimov2303@gmail.com',
    description: 'Email of user',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  // @ApiProperty({
  //   example: 'shahbozmamatkarimov2303@gmail.com',
  //   description: 'Email of user',
  // })
  // @IsOptional()
  // @IsPhoneNumber()
  // phone?: string;

  @ApiProperty({
    example: 'shahbozmamatkarimov2303@gmail.com',
    description: 'Email of user',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
