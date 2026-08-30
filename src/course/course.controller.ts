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
  UseGuards,
} from '@nestjs/common';
import { CourseService } from './course.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CourseDto } from './dto/course.dto';
import { JwtService } from '@nestjs/jwt';
import { ImageValidationPipe } from '../common/pipes/image-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractUserIdFromToken } from '../common/utils/token';
import { AuthGuard } from 'src/common/guard/auth.guard';

@ApiTags('Course')
@Controller('course')
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly jwtService: JwtService,
  ) {}

  @ApiOperation({ summary: 'Create a new course' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        price: {
          type: 'integer',
        },
        discount: {
          type: 'integer',
        },
        group_id: {
          type: 'integer',
        },
        category_id: {
          type: 'integer',
        },
        attendance_days: {
          type: 'string',
          example: '["Mon", "Tue", "Wed"]',
          description: 'JSON array of attendance weekdays',
        },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('/create')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() courseDto: CourseDto,
    @UploadedFile(new ImageValidationPipe()) image: Express.Multer.File,
    @Headers() headers: string,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.courseService.create(courseDto, image, user_id);
  }

  @ApiOperation({ summary: 'Get course by ID' })
  @Get('/getById/:id')
  getById(@Param('id') id: number, @Headers() headers: string) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.courseService.getById(id, user_id);
  }

  @ApiOperation({ summary: 'Get group by ID' })
  @Get('/getUsersByGroupId/:group_id')
  getUsersByGroupId(
    @Param('group_id') group_id: number,
    @Query()
    {
      date,
      course_id,
      lesson_id,
      page,
    }: { date: Date; course_id: number; lesson_id: number; page: string },
    @Headers() headers: string,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.courseService.getUsersByGroupId(
      group_id,
      date,
      user_id,
      course_id,
      page,
      lesson_id,
    );
  }

  @ApiOperation({ summary: 'Get all lessons' })
  @Get('/')
  getAll(
    @Query('subcategory_id') subcategory_id: string,
    @Query('category_id') category_id: number,
    @Headers() headers: string,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.courseService.getAll(subcategory_id, user_id, category_id);
  }

  @ApiOperation({ summary: 'Get all courses' })
  @UseGuards(AuthGuard)
  @Get('/getByCourse/:id/:subcategory_id')
  getByCourse(
    @Param() { id, subcategory_id }: { id: number; subcategory_id: string },
    @Headers() headers: string,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.courseService.getByCourse(id, subcategory_id, user_id);
  }

  @ApiOperation({ summary: 'Get courses with pagination' })
  @Get('pagination/:page')
  pagination(@Param('page') page: number) {
    return this.courseService.pagination(page);
  }

  @ApiOperation({ summary: 'Update course profile by ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        price: {
          type: 'integer',
        },
        discount: {
          type: 'integer',
        },
        group_id: {
          type: 'integer',
        },
        category_id: {
          type: 'integer',
        },
        attendance_days: {
          type: 'string',
          example: '["Mon", "Tue", "Wed"]',
          description: 'JSON array of attendance weekdays',
        },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Put('/:id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: number,
    @Body() courseDto: CourseDto,
    @UploadedFile(new ImageValidationPipe()) image: Express.Multer.File,
    @Headers() headers: string,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);

    return this.courseService.update(id, courseDto, image, user_id);
  }

  @ApiOperation({ summary: 'Delete course' })
  @Delete(':id')
  deleteCourse(@Param('id') id: number) {
    return this.courseService.delete(id);
  }
}
