import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class MethodologicalDto {
  @ApiProperty({
    example: 'John Smith',
    description: 'Full name of user',
  })
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @ApiProperty({
    example: '+998901234567',
    description: 'Phone number of user',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    example: ['student'],
    description: 'Role of the user',
  })
  @IsNotEmpty()
  @IsArray()
  role: string[];

  @ApiProperty({
    example: ['Maths', 'Biology'],
    description: 'Subjects of the user',
  })
  @IsNotEmpty()
  @IsArray()
  subjects: string[];
}
