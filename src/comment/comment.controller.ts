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
import { CommentService } from './comment.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommentDto } from './dto/comment.dto';
import { JwtService } from '@nestjs/jwt';
import { ImageValidationPipe } from '../pipes/image-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractUserIdFromToken } from 'src/utils/token';

@ApiTags('Comments')
@Controller('comments')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly jwtService: JwtService,
  ) { }

  @ApiOperation({ summary: 'Create a new comment' })
  @Post('/create')
  async create(
    @Body() commentDto: CommentDto,
    @Headers() headers: Record<string, string>,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.commentService.create(commentDto, user_id);
  }

  @ApiOperation({ summary: 'Get comment by ID' })
  // @UseGuards(AuthGuard)
  @Get('/getById/:id')
  getById(@Param('id') id: number) {
    return this.commentService.getById(id);
  }

  @ApiOperation({ summary: 'Get all comments' })
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
    return this.commentService.getAll(0);
  }

  @ApiOperation({ summary: 'Get comments with pagination' })
  // @UseGuards(AuthGuard)
  @Get('pagination/:page')
  pagination(@Param('page') page: number) {
    // return this.commentService.pagination(page);
  }

  @ApiOperation({ summary: 'Update comment profile by ID' })
  // @UseGuards(AuthGuard)
  @Put('/:id')
  update(@Param('id') id: number, @Body() commentDto: CommentDto) {
    return this.commentService.update(id, commentDto);
  }

  @ApiOperation({ summary: 'Delete comment' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  deleteComment(@Param('id') id: number) {
    return this.commentService.delete(id);
  }
}
