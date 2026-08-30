import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { RoleName } from 'src/activity/models/activity.models';
import { RegisterUserDto } from 'src/user/dto/register.dto';

export class CreateSubscriptionsDto {
  @ApiProperty({
    example: 'student',
    description: 'role name',
  })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty({
    example: 'student',
    description: 'role name',
  })
  @IsOptional()
  @IsEnum(RoleName)
  role: RoleName;

  @ApiProperty({
    example: 1,
    description: 'Course id',
  })
  @IsNotEmpty()
  @IsArray()
  course_ids: number[];

  @ApiProperty({
    example: 1,
    description: 'Course id',
  })
  @IsNotEmpty()
  @IsDateString()
  start_date: Date;

  @ApiProperty({
    example: '{"3":12,"5":14}',
    description:
      'JSON map of course_id -> subgroup_id, for any of the given course_ids that are split into subgroups (weekday schedules). Omit a course_id here to leave it unassigned; omit the whole field for courses without subgroups.',
    required: false,
  })
  @IsOptional()
  @IsString()
  subgroups?: string;
}
