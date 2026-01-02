import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Headers,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { TestsService } from './test.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QuestionDto, TestsDto } from './dto/test.dto';
import { CheckDto } from './dto/check.dto';
import { extractUserIdFromToken } from 'src/utils/token';
import { JwtService } from '@nestjs/jwt';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageValidationPipe } from 'src/pipes/image-validation.pipe';

@ApiTags('Tests')
@Controller('tests')
export class TestsController {
  constructor(
    private readonly testsService: TestsService,
    private readonly jwtService: JwtService,
  ) { }

  @ApiOperation({ summary: 'Create a new tests' })
  @Post('/create')
  create(
    @Body() testsDto: TestsDto,
    @Headers() headers: Record<string, string>,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.testsService.create(testsDto, user_id);
  }

  @ApiOperation({ summary: 'Get all testss' })
  // @UseGuards(AuthGuard)
  @Get()
  getTests() {
    return this.testsService.getTests();
  }

  @ApiOperation({ summary: 'Get all testss' })
  // @UseGuards(AuthGuard)
  @Get('/class/:class_number')
  getAll(@Param('class_number') class_number: number) {
    return this.testsService.getAll(class_number);
  }

  // @ApiOperation({ summary: 'checkById all tests' })
  // // @UseGuards(AuthGuard)
  // @Post('/check/:id')
  // checkById(@Param('id') id: number, @Body() answers: any) {
  //   return this.testsService.checkById(id, answers);
  // }

  @ApiOperation({ summary: 'checkById all tests' })
  // @UseGuards(AuthGuard)
  @Post('/check/:id')
  checkById(@Param('id') id: number, @Body() { answer }: { answer: any }) {
    return this.testsService.checkById(id, answer);
  }

  @ApiOperation({ summary: 'checkById all tests' })
  // @UseGuards(AuthGuard)
  @Post('/check_answers/:lesson_id')
  checkAllAnswers(
    @Param('lesson_id') lesson_id: number,
    @Body() answers: CheckDto,
    @Headers() headers: Record<string, string>,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.testsService.checkAnswers(user_id, lesson_id, answers);
  }

  @ApiOperation({ summary: 'Get tests by ID' })
  // @UseGuards(AuthGuard)
  @Get('/:id')
  getById(@Param('id') id: number, @Headers() headers: Record<string, string>) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.testsService.getById(id, user_id);
  }

  @ApiOperation({ summary: 'Get testss with pagination' })
  // @UseGuards(AuthGuard)
  @Get('pagination/:page')
  pagination(@Param('page') page: number) {
    return this.testsService.pagination(page);
  }

  @ApiOperation({ summary: 'Create a url' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  // @UseGuards(AuthGuard)
  @Post('/create_url')
  @UseInterceptors(FileInterceptor('file'))
  create_url(
    @UploadedFile(new ImageValidationPipe()) file: Express.Multer.File,
  ) {
    console.log('object');
    return this.testsService.create_url(file);
  }

  @ApiOperation({ summary: 'Update tests profile by ID' })
  // @UseGuards(AuthGuard)
  @Put('/:id')
  update(@Param('id') id: number, @Body() questionDto: QuestionDto) {
    return this.testsService.update(id, questionDto);
  }

  @ApiOperation({ summary: 'Delete tests' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  deleteTests(@Param('id') id: number) {
    return this.testsService.delete(id);
  }

  // mobile
  @ApiOperation({ summary: 'checkById all tests' })
  // @UseGuards(AuthGuard)
  @Post('/set_answers/:lesson_id')
  setAnswers(
    @Param('lesson_id') lesson_id: number,
    @Body() answers: CheckDto,
    @Headers() headers: Record<string, string>,
  ) {
    const user_id = extractUserIdFromToken(headers, this.jwtService, true);
    return this.testsService.setAnswers(user_id, lesson_id, answers);
  }
}
