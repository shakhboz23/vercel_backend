import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttendanceDto } from './dto/attendance.dto';

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
  ) {}

  @ApiOperation({ summary: 'Registration a new user' })
  @Post('/create')
  async create(
    @Body() attendanceDto: AttendanceDto,
  ) {
    const data = await this.attendanceService.create(attendanceDto);
    return data;
  }

  @ApiOperation({ summary: 'Get all users' })
  // @UseGuards(AuthGuard)
  @Get('getByRole')
  getAll() {
    return this.attendanceService.getAll();
  }

  @ApiOperation({ summary: 'Get user by ID' })
  // @UseGuards(AuthGuard)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.attendanceService.getById(id);
  }

  @ApiOperation({ summary: 'Get users with pagination' })
  // @UseGuards(AuthGuard)
  @Get('pagination/:page/:limit')
  pagination(@Param('page') page: number, @Param('limit') limit: number) {
    return this.attendanceService.pagination(page, limit);
  }

  @ApiOperation({ summary: 'Delete user by ID' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.attendanceService.deleteUser(id);
  }
}
