import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Test_settingsDto } from 'src/test_settings/dto/test_settings.dto';
import { ActionType, TestType } from '../models/test.models';

export class QuestionDto {
  @ApiProperty({
    example: 1,
    description: 'id of the test',
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({
    example: 'Quyidagi izotopda nechta proton, elektron va neytron bor? 18^F-',
    description: 'The question text',
  })
  @IsNotEmpty()
  @IsString()
  question: string;

  @ApiProperty({
    example: [
      '5 proton, 4 elektron, 2 neytron',
      '4 proton, 8 elektron, 1 neytron',
      '6 proton, 1 elektron, 8 neytron'
    ],
    description: 'Answer options for the question',
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  variants: string[];

  @ApiProperty({
    example: [1],
    description: 'True answer',
  })
  @IsNotEmpty()
  @IsArray()
  true_answer: number[];

  @ApiProperty({
    example: 1,
    description: 'Test type',
  })
  @IsNotEmpty()
  @IsEnum(TestType)
  type: TestType;


  @ApiProperty({
    example: 1,
    description: 'Test type',
    default: ActionType.new,
  })
  @IsOptional()
  @IsEnum(ActionType)
  @Transform(({ value }) => (value === undefined ? ActionType.new : value))
  is_action: ActionType;
}

export class TestsDto extends Test_settingsDto {
  @ApiProperty({
    example: 1,
    description: 'Test id of the tests',
  })
  @IsNotEmpty()
  @IsNumber()
  lesson_id: number;

  @ApiProperty({
    type: [QuestionDto],
    description: 'Array of test questions',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  test: QuestionDto[];

  @ApiProperty({
    example: 1,
    description: 'Test id of the tests',
  })
  @IsOptional()
  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => QuestionDto)
  files: any[];
}
