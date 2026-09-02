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
  Query,
} from '@nestjs/common';
import { LessonService } from './lesson.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LessonDto } from './dto/lesson.dto';
import { JwtService } from '@nestjs/jwt';
import { ImageValidationPipe } from '../common/pipes/image-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractUserIdFromToken } from 'src/common/utils/token';

@ApiTags('Lesson')
@Controller('lesson')
export class LessonController {
  constructor(
    private readonly lessonService: LessonService,
    private readonly jwtService: JwtService,
  ) {}

  @ApiOperation({ summary: 'Create a new lesson' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        course_id: {
          type: 'number',
        },
        lesson_id: {
          type: 'number',
        },
        title: {
          type: 'string',
        },
        content: {
          type: 'string',
        },
        type: {
          type: 'string',
        },
        published: {
          type: 'boolean',
        },
        video: {
          type: 'string',
          format: 'binary',
        },
        start_date: {
          type: 'string',
          format: 'date',
        },
      },
    },
  })
  @Post('/create')
  @UseInterceptors(FileInterceptor('video'))
  async create(
    @Body() lessonDto: LessonDto,
    @UploadedFile(new ImageValidationPipe()) video: Express.Multer.File,
  ) {
    return this.lessonService.create(lessonDto, video);
  }

  @ApiOperation({ summary: 'Get lesson by ID' })
  @Get('/getById/:id')
  getById(@Param('id') id: number, @Headers() headers?: string) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.lessonService.getById(id, user_id);
  }

  @ApiOperation({ summary: 'Get all lessons' })
  @Get('/')
  getAll(
    @Query('subcategory_id') subcategory_id: string,
    @Query('category_id') category_id: number,
  ) {
    return this.lessonService.getAll(subcategory_id, category_id);
  }

  @ApiOperation({ summary: 'Get all lessons' })
  @Get('/getByCourse/:id')
  getByCourse(
    @Param('id') id: number,
    @Headers() headers: string,
    @Query('date') date: string,
    @Query('search') search: string,
    @Query('status') status: string,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.lessonService.getByCourse(+id, user_id, date, search, status);
  }

  @ApiOperation({ summary: 'Get lessons with pagination' })
  @Get('pagination/:page')
  pagination(@Param('page') page: number) {
    return this.lessonService.pagination(page);
  }

  @ApiOperation({ summary: 'Update lesson profile by ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        course_id: {
          type: 'number',
        },
        lesson_id: {
          type: 'number',
        },
        title: {
          type: 'string',
        },
        content: {
          type: 'string',
        },
        type: {
          type: 'string',
        },
        published: {
          type: 'boolean',
        },
        video: {
          type: 'string',
          format: 'binary',
        },
        start_date: {
          type: 'string',
          format: 'date',
        },
      },
    },
  })
  @Put('/:id')
  @UseInterceptors(FileInterceptor('video'))
  update(
    @Param('id') id: number,
    @Body() lessonDto: LessonDto,
    @UploadedFile(new ImageValidationPipe()) video: Express.Multer.File,
  ) {
    return this.lessonService.update(id, lessonDto, video);
  }

  @ApiOperation({ summary: 'Delete lesson' })
  @Delete(':id')
  deleteLesson(@Param('id') id: number) {
    return this.lessonService.delete(id);
  }
}
