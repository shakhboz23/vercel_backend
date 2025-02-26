import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ChatsDto {
  @ApiProperty({
    example: 'A1',
    description: 'Name of the chat',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: '8-class',
    description: 'Description of the chat',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 'Monday, Wednesday, Friday',
    description: 'Weeks of the chat',
  })
  @IsNotEmpty()
  @IsString()
  weeks: string;

  @ApiProperty({
    example: '1',
    description: 'Subject id of the chat',
  })
  @IsNotEmpty()
  @IsNumber()
  subject_id: number;

  @ApiProperty({
    example: '11/10/2023',
    description: 'Start date of the chat',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: Date;

  @ApiProperty({
    example: '09:00',
    description: 'Start time of the chat',
  })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiProperty({
    example: 'abdds-sdsdsd46sdsd-s54s5ds',
    description: 'Teacher id of the chat',
  })
  @IsNotEmpty()
  @IsString()
  teacher_id: string;
}
