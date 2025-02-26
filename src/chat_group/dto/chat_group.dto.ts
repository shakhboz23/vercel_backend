import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export enum ChatGroupType {
  private = 'private',
  group = 'group',
  channel = 'channel',
}

export class ChatGroupDto {
  @ApiProperty({
    example: 1,
    description: 'chat group title',
  })
  @IsNotEmpty()
  @IsNumber()
  course_id: number;

  @ApiProperty({
    example: 1,
    description: 'chat group title',
  })
  @IsNotEmpty()
  @IsNumber()
  group_id: number;

  @ApiProperty({
    example: 'A',
    description: 'chat group type',
  })
  @IsNotEmpty()
  @IsEnum(ChatGroupType)
  chat_type: ChatGroupType;
}
