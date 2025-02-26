import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { GenderType } from '../../role/models/role.models';

export class UpdateDto {
  @ApiProperty({
    example: 'https://example.com',
    description: 'The image of the subscription_activity',
  })
  @IsOptional()
  @IsString()
  image: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'full name of the subscription_activity',
  })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'full name of the subscription_activity',
  })
  @IsOptional()
  @IsString()
  surname: string;
}
