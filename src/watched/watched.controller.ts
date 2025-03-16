import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Headers,
  Put,
} from '@nestjs/common';
import { WatchedService } from './watched.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WatchedDto } from './dto/watched.dto';
import { extractUserIdFromToken } from 'src/utils/token';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Watched')
@Controller('watched')
export class WatchedController {
  constructor(
    private readonly watchedService: WatchedService,
    private readonly jwtService: JwtService,
    // private readonly chatGateway: ChatGateway,ChatGateway
  ) { }

  @ApiOperation({ summary: 'Registration a new watched' })
  @Post('/create')
  async create(
    @Body() watchedDto: WatchedDto,
    @Headers() headers: Record<string, string>,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.watchedService.create(watchedDto, user_id);
  }

  @ApiOperation({ summary: 'Get watcheds with pagination' })
  // @UseGuards(AuthGuard)
  @Get('/:type/:analytics_id')
  getAll(
    @Param('page') page: number, @Param('type') type: string, @Param('analytics_id') analytics_id: number,
    @Headers() headers: Record<string, string>
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true)

    return this.watchedService.getAll(user_id, type, analytics_id);
  }

  @ApiOperation({ summary: 'Get watcheds with pagination' })
  // @UseGuards(AuthGuard)
  @Get('pagination/:page/:limit')
  pagination(@Param('page') page: number, @Param('limit') limit: number) {
    return this.watchedService.pagination(page, limit);
  }

  @ApiOperation({ summary: 'Delete watched by ID' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.watchedService.delete(id);
  }
}
