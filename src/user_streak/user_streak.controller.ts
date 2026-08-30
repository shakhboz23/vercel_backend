import {
  Controller,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
import { UserStreakService } from './user_streak.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('UserStreak')
@Controller('userStreak')
export class UserStreakController {
  constructor(
    private readonly userStreakService: UserStreakService,
  ) {}

  @ApiOperation({ summary: 'Get all users' })
  @Get('getByRole')
  getAll() {
    return this.userStreakService.getAll();
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.userStreakService.getById(id);
  }

  @ApiOperation({ summary: 'Get users with pagination' })
  @Get('pagination/:page/:limit')
  pagination(@Param('page') page: number, @Param('limit') limit: number) {
    return this.userStreakService.pagination(page, limit);
  }

  @ApiOperation({ summary: 'Delete user by ID' })
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.userStreakService.deleteUser(id);
  }
}
