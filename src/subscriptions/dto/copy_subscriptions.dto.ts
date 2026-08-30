import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CopySubscriptionsDto {
  @ApiProperty({
    example: 3,
    description: 'Course id to copy the students from',
  })
  @IsNotEmpty()
  @IsNumber()
  from_course_id: number;

  @ApiProperty({
    example: 5,
    description: 'Course id the students should be added to',
  })
  @IsNotEmpty()
  @IsNumber()
  to_course_id: number;

  @ApiProperty({
    example: '2026-08-30',
    description:
      'Enrollment start date to record for every copied student, defaults to today',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  start_date?: Date;

  @ApiProperty({
    example: [1, 2, 3],
    description:
      'Subset of user ids (from the source course) to copy over; omit to copy every student enrolled in the source course',
    required: false,
  })
  @IsOptional()
  @IsArray()
  user_ids?: number[];

  @ApiProperty({
    example: 12,
    description:
      'Subgroup id in the target course to assign every copied student to, when the target course is split into subgroups',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  subgroup_id?: number;
}
