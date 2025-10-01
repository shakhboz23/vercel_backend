import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Headers,
} from '@nestjs/common';
import { ReytingService } from './reyting.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReytingDto } from './dto/reyting.dto';
import { extractUserIdFromToken } from 'src/utils/token';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Reyting')
@Controller('reyting')
export class ReytingController {
  constructor(
    private readonly reytingService: ReytingService,
    private readonly jwtService: JwtService,
    // private readonly chatGateway: ChatGateway,ChatGateway
  ) {}

  @ApiOperation({ summary: 'Registration a new reyting' })
  @Post('/create')
  async create(
    @Body() reytingDto: ReytingDto,
    @Headers() headers: Record<string, string>,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.reytingService.create(reytingDto, user_id);
  }

  @ApiOperation({ summary: 'Get all reytings' })
  // @UseGuards(AuthGuard)
  @Get('/getall/:subject_id/:group_id')
  getAll(
    @Param('subject_id') subject_id: number,
    @Param('group_id') group_id: number,
    @Headers() headers: Record<string, string>,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.reytingService.getAll(subject_id, group_id, user_id);
  }

  @ApiOperation({ summary: 'Get all reytings' })
  // @UseGuards(AuthGuard)
  @Post('/markAsRead/:lesson_id')
  markAsRead(
    @Param('lesson_id') lesson_id: number,
    @Headers() headers: Record<string, string>,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.reytingService.markAsRead(user_id, lesson_id);
  }

  @ApiOperation({ summary: 'Get all reytings' })
  // @UseGuards(AuthGuard)
  @Get('/getLessonReyting/:lesson_id')
  getLessonsReyting(
    @Param('lesson_id') lesson_id: number,
    @Headers() headers: Record<string, string>,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.reytingService.getLessonsReyting(lesson_id, user_id);
  }

  @ApiOperation({ summary: 'Get reytings with pagination' })
  // @UseGuards(AuthGuard)
  @Get('pagination/:page/:limit')
  pagination(@Param('page') page: number, @Param('limit') limit: number) {
    return this.reytingService.pagination(page, limit);
  }

  // @ApiOperation({ summary: 'Update user profile by ID' })
  // // @UseGuards(AuthGuard)
  // @Put('profile/:id')
  // update(@Param('id') id: string, @Body() updateDto: UpdateDto) {
  //   return this.reytingService.update(id, updateDto);
  // }

  @ApiOperation({ summary: 'Delete reyting by ID' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.reytingService.delete(id);
  }
}
