import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { GenderType } from '../../role/models/role.models';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'https://example.com',
    description: 'The image of the user',
  })
  @IsOptional()
  @IsString()
  image: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'full name of the user',
  })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'full name of the user',
  })
  @IsOptional()
  @IsString()
  surname: string;

  @ApiProperty({
    example: ['Maths', 'Biology'],
    description: 'Subjects of the user',
  })
  @IsOptional()
  subjects: string[];

  @ApiProperty({
    example: [
      ['1', 'A'],
      ['2', 'B'],
      ['3', 'C'],
      ['4', 'D'],
      ['5', 'E'],
    ],
    description: 'Classes of the user',
  })
  @IsOptional()
  class: string[][];

  @ApiProperty({
    example: 'Samarkand',
    description: 'Region name of user',
  })
  @IsOptional()
  region: string;

  @ApiProperty({
    example: 'Kattakhurgan',
    description: 'District name of user',
  })
  @IsOptional()
  district: string;

  @ApiProperty({
    example: '25',
    description: 'School number of user',
  })
  @IsOptional()
  school_number: number;

  @ApiProperty({
    example: GenderType.MALE,
    description: 'gender of the user',
    enum: GenderType,
  })
  @IsOptional()
  @IsEnum(GenderType)
  gender: GenderType;

  @ApiProperty({
    example: false,
    description: 'get answered notification for the user',
  })
  @IsOptional()
  @IsBoolean()
  get_answered: boolean;

  @ApiProperty({
    example: true,
    description: 'new task notification for the user',
  })
  @IsOptional()
  @IsBoolean()
  new_task: boolean;

  @ApiProperty({
    example: true,
    description: 'chat messages notification for the user',
  })
  @IsOptional()
  @IsBoolean()
  chat_messages: boolean;
}
