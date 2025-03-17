import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Headers,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { LikeService } from './like.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LikeDto } from './dto/like.dto';
import { JwtService } from '@nestjs/jwt';
import { ImageValidationPipe } from '../pipes/image-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractUserIdFromToken } from 'src/utils/token';

@ApiTags('Likes')
@Controller('likes')
export class LikeController {
  constructor(
    private readonly likeService: LikeService,
    private readonly jwtService: JwtService,
  ) { }

  @ApiOperation({ summary: 'Create a new like' })
  @Post('/create')
  async create(
    @Body() likeDto: LikeDto,
    @Headers() headers: Record<string, string>,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.likeService.create(likeDto, user_id);
  }

  @ApiOperation({ summary: 'Get like by ID' })
  // @UseGuards(AuthGuard)
  @Get('/getById/:id')
  getById(@Param('id') id: number) {
    return this.likeService.getById(id);
  }

  @ApiOperation({ summary: 'Get all likes' })
  // @UseGuards(AuthGuard)
  @Get('/')
  getAll(@Headers() headers?: string) {
    const auth_header = headers['authorization'];
    const token = auth_header?.split(' ')[1];
    console.log(token, 'token2303');
    const user = token
      ? this.jwtService.verify(token, { secret: process.env.ACCESS_TOKEN_KEY })
      : null;
    const user_id = user?.id;
    // console.log(user_id, '565456');
    return this.likeService.getAll(0);
  }

  @ApiOperation({ summary: 'Get likes with pagination' })
  // @UseGuards(AuthGuard)
  @Get('pagination/:page')
  pagination(@Param('page') page: number) {
    // return this.likeService.pagination(page);
  }

  @ApiOperation({ summary: 'Update like profile by ID' })
  // @UseGuards(AuthGuard)
  @Put('/:id')
  update(@Param('id') id: number, @Body() likeDto: LikeDto) {
    return this.likeService.update(id, likeDto);
  }

  @ApiOperation({ summary: 'Delete like' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  deleteLike(@Param('id') id: number) {
    return this.likeService.delete(id);
  }
}
