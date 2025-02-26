import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GenderType } from '../../role/models/role.models';

export class UpdateDto {
  @ApiProperty({
    example: 'https://example.com',
    description: 'The image of the user',
  })
  @IsOptional()
  image: any;

  @ApiProperty({
    example: 'John Doe',
    description: 'full name of the user',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'full name of the user',
  })
  @IsNotEmpty()
  @IsString()
  surname: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'full name of the user',
  })
  @IsOptional()
  @IsString()
  bio: string;
}
