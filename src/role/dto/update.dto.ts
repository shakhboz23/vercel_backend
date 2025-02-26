import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { GenderType } from '../../role/models/role.models';

export class UpdateDto {
  @ApiProperty({
    example: 'John Smith',
    description: 'Name of user',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'John Smith',
    description: 'Surname of user',
  })
  @IsNotEmpty()
  @IsString()
  surname: string;

  // @ApiProperty({
  //   example: '+998901234567',
  //   description: 'Phone number of user',
  // })
  // @IsNotEmpty()
  // @IsString()
  // phone: string; 
     
  @ApiProperty({
    example: ['Maths', 'Biology'],
    description: 'Subjects of the user',
  })
  @IsOptional()
  @IsArray()
  subjects: string[];
}
