import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString } from 'class-validator';

export class LikeDto {
  @ApiProperty({
    example: 1,
    description: 'User id',
  })
  @IsNotEmpty()
  @IsNumberString()
  user_id: number;

  @ApiProperty({
    example: 1,
    description: 'Course id',
  })
  @IsNotEmpty()
  @IsNumberString()
  course_id: number;
}
