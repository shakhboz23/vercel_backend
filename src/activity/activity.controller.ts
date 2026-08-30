import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivityDto } from './dto/activity.dto';
import { GetActivityDto } from './dto/get_activity.dto';

@ApiTags('Activity')
@Controller('activity')
export class ActivityController {
  constructor(
    private readonly activityService: ActivityService,
  ) {}

  @ApiOperation({ summary: 'Registration a new user' })
  @Post('register')
  async register(
    @Body() activityDto: ActivityDto,
  ) {
    const data = await this.activityService.create(activityDto);
    return data;
  }

  @ApiOperation({ summary: 'Get all users' })
  @Get('getByRole')
  getAll() {
    return this.activityService.getAll();
  }

  @ApiOperation({ summary: 'Get user reytings' })
  @Post('/getactivity')
  getActivity(@Body() getActivityDto: GetActivityDto) {
    return this.activityService.getActivity(getActivityDto);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.activityService.getById(id);
  }

  @ApiOperation({ summary: 'Get users with pagination' })
  @Get('pagination/:page/:limit')
  pagination(@Param('page') page: number, @Param('limit') limit: number) {
    return this.activityService.pagination(page, limit);
  }

  @ApiOperation({ summary: 'Delete user by ID' })
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.activityService.deleteUser(id);
  }
}
