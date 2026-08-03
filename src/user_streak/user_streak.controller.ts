import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { UserStreakService } from './user_streak.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserStreakDto } from './dto/user_streak.dto';

@ApiTags('UserStreak')
@Controller('userStreak')
export class UserStreakController {
  constructor(
    private readonly userStreakService: UserStreakService,
  ) {}

  // @ApiOperation({ summary: 'Registration a new user' })
  // @Post('/create')
  // async create(
  //   @Body() userStreakDto: UserStreakDto,
  // ) {
  //   const data = await this.userStreakService.create(userStreakDto);
  //   return data;
  // }

  @ApiOperation({ summary: 'Get all users' })
  // @UseGuards(AuthGuard)
  @Get('getByRole')
  getAll() {
    return this.userStreakService.getAll();
  }

  @ApiOperation({ summary: 'Get user by ID' })
  // @UseGuards(AuthGuard)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.userStreakService.getById(id);
  }

  @ApiOperation({ summary: 'Get users with pagination' })
  // @UseGuards(AuthGuard)
  @Get('pagination/:page/:limit')
  pagination(@Param('page') page: number, @Param('limit') limit: number) {
    return this.userStreakService.pagination(page, limit);
  }

  @ApiOperation({ summary: 'Delete user by ID' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.userStreakService.deleteUser(id);
  }
}
