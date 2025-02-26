import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class RoleDto {
  // @ApiProperty({
  //   example: ['Maths', 'Biology'],
  //   description: 'Subjects of the user',
  // })
  // @IsOptional()
  // @IsArray()
  // subjects: string[];

  @ApiProperty({
    example: 'John Smith',
    description: 'Full name of user',
  })
  @IsOptional()
  // @IsNumber()
  user_id?: number;

  @ApiProperty({
    example: 'student',
    description: 'Role of user',
  })
  @IsNotEmpty()
  @IsString()
  role: string;
}
