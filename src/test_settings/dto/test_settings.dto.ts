import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class Test_settingsDto {
  @ApiProperty({
    example: 'Vocabulary',
    description: 'Test, Vocabulary, IELTS',
  })
  @IsOptional()
  test_type: string;

  @ApiProperty({
    example: 'Atomlar haqida',
    description: 'Test_settings Title',
  })
  @IsOptional()
  start_date: Date;

  @ApiProperty({
    example: 'You learn about Web development',
    description: 'Test_settings description',
  })
  @IsOptional()
  end_date: Date;

  @ApiProperty({
    example: 3,
    description: 'Test sort level',
  })
  @IsOptional()
  sort_level: any[];

  @ApiProperty({
    example: 1,
    description: 'Test id',
  })
  @IsOptional()
  lesson_id: number;

  @ApiProperty({
    example: 1,
    description: 'Test id',
  })
  @IsOptional()
  period: string;

  @ApiProperty({
    example: true,
    description: 'Test mix',
  })
  @IsOptional()
  mix: boolean;
}
