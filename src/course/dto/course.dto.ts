import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsBooleanString,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { GroupType } from 'src/group/dto/group.dto';

export class CourseDto {
  @ApiProperty({
    example: 'Title',
    description: 'Course title',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Description',
    description: 'Course Description',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: 12,
    description: 'Course price',
  })
  @IsNotEmpty()
  @IsNumberString()
  price: number;

  @ApiProperty({
    example: 0,
    description: 'Course price',
  })
  @IsOptional()
  @IsNumberString()
  discount: number;

  @ApiProperty({
    example: 1,
    description: 'Course id',
  })
  @IsNotEmpty()
  @IsNumberString()
  group_id: number;

  @ApiProperty({
    example: '2023-10-10',
    description: 'Course start date',
  })
  @IsNotEmpty()
  @IsDateString()
  start_date: Date;

  @ApiProperty({
    example: 1,
    description: 'Teacher id',
  })
  @IsOptional()
  teacher_id?: number;

  @ApiProperty({
    example: 1,
    description: 'Course id',
  })
  @IsNotEmpty()
  @IsNumberString()
  subcategory_id: number;

  @ApiProperty({
    example: false,
    description: 'Course type',
  })
  @IsOptional()
  @IsBooleanString()
  type: boolean;


  @ApiProperty({
    example: 'A',
    description: 'group type',
  })
  @IsOptional()
  @IsEnum(GroupType)
  group_type?: GroupType;

  @ApiProperty({
    example: '["Mon", "Tue", "Wed"]',
    description: 'JSON array of the days on which attendance is taken. Ignored when subgroups is present.',
    required: false,
  })
  @IsOptional()
  @IsString()
  attendance_days?: string;

  @ApiProperty({
    example: '[{"name":"1-guruh","attendance_days":["Mon","Wed","Fri"]},{"name":"2-guruh","attendance_days":["Tue","Thu","Sat"]}]',
    description:
      'JSON array of subgroups for an offline course split across multiple weekly schedules (e.g. because one physical classroom cannot fit everyone). Lessons and tests stay shared by the whole course. Pass an existing subgroup "id" to rename it or change its days; omit it to create a new subgroup; omit a subgroup entirely to remove it.',
    required: false,
  })
  @IsOptional()
  @IsString()
  subgroups?: string;
}
