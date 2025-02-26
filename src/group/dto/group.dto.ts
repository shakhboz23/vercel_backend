import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class GroupDto {
  @ApiProperty({
    example: 'A',
    description: 'Group name',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'A',
    description: 'Group name',
  })
  @IsNotEmpty()
  @IsString()
  description: string;
}
