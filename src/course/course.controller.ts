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
import { ImageValidationPipe } from '../pipes/image-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractUserIdFromToken } from '../utils/token';

@ApiTags('Course')
@Controller('course')
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly jwtService: JwtService,
  ) { }

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
    console.log(image, 2303);
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    console.log(user_id);
    return this.courseService.create(courseDto, image, user_id);
  }

  @ApiOperation({ summary: 'Get course by ID' })
  // @UseGuards(AuthGuard)
  @Get('/getById/:id')
  getById(@Param('id') id: number, @Headers() headers: string) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    console.log(user_id);
    return this.courseService.getById(id, user_id);
  }

  @ApiOperation({ summary: 'Get group by ID' })
  // @UseGuards(AuthGuard)
  @Get('/getUsersByGroupId/:group_id')
  getUsersByGroupId(@Param('group_id') group_id: number, @Query() { date, course_id, page }: { date: Date, course_id: number, page: string }, @Headers() headers: string) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.courseService.getUsersByGroupId(group_id, date, user_id, course_id, page);
  }

  @ApiOperation({ summary: 'Get all lessons' })
  // @UseGuards(AuthGuard)
  @Get('/:category_id')
  getAll(
    @Param('category_id') category_id: number,
    @Headers() headers: string,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.courseService.getAll(category_id, user_id);
  }


  // @ApiOperation({ summary: 'Get all courses' })
  // // @UseGuards(AuthGuard)
  // @Get('/')
  // getAll(@Headers() headers?: string) {
  //   const auth_header = headers['authorization'];
  //   const token = auth_header?.split(' ')[1];
  //   const user = token
  //     ? this.jwtService.verify(token, { secret: process.env.ACCESS_TOKEN_KEY })
  //     : null;
  //   const user_id = user?.id;
  //   console.log(user_id, '565456');
  //   return this.courseService.getAll();
  // }

  @ApiOperation({ summary: 'Get all courses' })
  // @UseGuards(AuthGuard)
  @Get('/getByCourse/:id/:category_id')
  getByCourse(@Param() { id, category_id }: { id: number, category_id: number }, @Headers() headers: string) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.courseService.getByCourse(id, category_id, user_id);
  }

  @ApiOperation({ summary: 'Get courses with pagination' })
  // @UseGuards(AuthGuard)
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
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  // @UseGuards(AuthGuard)
  @Put('/:id')
  @UseInterceptors(FileInterceptor('image'))
  update(@Param('id') id: number, @Body() courseDto: CourseDto,
    @UploadedFile(new ImageValidationPipe()) image: Express.Multer.File,
    @Headers() headers: string,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);

    return this.courseService.update(id, courseDto, image, user_id);
  }

  @ApiOperation({ summary: 'Delete course' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  deleteCourse(@Param('id') id: number) {
    return this.courseService.delete(id);
  }
}
