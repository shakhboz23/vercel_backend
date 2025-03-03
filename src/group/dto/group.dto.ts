import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum GroupType {
  public = 'public',
  private = 'private',
}

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

  @ApiProperty({
    example: 'A',
    description: 'group type',
  })
  @IsOptional()
  @IsEnum(GroupType)
  group_type?: GroupType;
}
