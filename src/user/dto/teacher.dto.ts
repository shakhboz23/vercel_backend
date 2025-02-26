import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class TeacherDto {
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

  @ApiProperty({
    example: [["1", "A"], ["2", "B"], ["3", "C"], ["4", "D"], ["5", "E"]],
    description: 'Classes of the user',
  })
  @IsNotEmpty()
  @IsArray()
  class: string[][];

  @ApiProperty({
    example: 'Samarkand',
    description: 'Region name of user',
  })
  @IsNotEmpty()
  @IsString()
  region: string;

  @ApiProperty({
    example: 'Kattakhurgan',
    description: 'District name of user',
  })
  @IsNotEmpty()
  @IsString()
  district: string;

  @ApiProperty({
    example: '25',
    description: 'School number of user',
  })
  @IsNotEmpty()
  @IsNumber()
  school_number: number;
}
