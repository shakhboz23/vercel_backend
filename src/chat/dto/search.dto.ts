import { ApiProperty } from '@nestjs/swagger';

export class SearchDto {
  @ApiProperty({
    example: '1',
    description: 'search value of the chat',
  })
  search: string;

  @ApiProperty({
    example: 'name',
    description: 'search type',
  })
  searchType: string;
}
