import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { RoleName } from 'src/activity/models/activity.models';

export class SubscriptionsDto {
  @ApiProperty({
    example: 1,
    description: 'Which of the course subgroups (weekday schedule) the student follows, when the course is split. Omit for courses without subgroups.',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  subgroup_id?: number;

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
  @IsNumber()
  course_id: number;

  @ApiProperty({
    example: 1,
    description: 'Course id',
  })
  @IsNotEmpty()
  @IsDateString()
  start_date: Date;
}
