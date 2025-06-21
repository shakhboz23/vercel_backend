import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsOptional } from 'class-validator';

export class Test_settingsDto {
  @ApiProperty({
    example: 'Vocabulary',
    description: 'Test, Vocabulary, IELTS',
  })
  @IsOptional()
  // @IsDate()
  test_type: string;

  @ApiProperty({
    example: 'Atomlar haqida',
    description: 'Test_settings Title',
  })
  @IsOptional()
  // @IsDate()
  start_date: Date;

  @ApiProperty({
    example: 'You learn about Web development',
    description: 'Test_settings description',
  })
  @IsOptional()
  // @IsDate()
  end_date: Date;

  @ApiProperty({
    example: 3,
    description: 'Test sort level',
  })
  @IsOptional()
  // @IsNumber()
  sort_level: any[];

  @ApiProperty({
    example: 1,
    description: 'Test id',
  })
  @IsOptional()
  // @IsNumber()
  lesson_id: number;

  @ApiProperty({
    example: 1,
    description: 'Test id',
  })
  @IsOptional()
  // @IsNumber()
  period: string;

  @ApiProperty({
    example: true,
    description: 'Test mix',
  })
  @IsOptional()
  // @IsNumber()
  mix: boolean;
}
