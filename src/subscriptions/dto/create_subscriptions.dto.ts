import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
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
}
