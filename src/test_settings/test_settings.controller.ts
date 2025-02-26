import { JwtService } from '@nestjs/jwt';
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
import { Test_settingsService } from './test_settings.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Test_settingsDto } from './dto/test_settings.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageValidationPipe } from '../pipes/image-validation.pipe';

@ApiTags('Test_settings')
@Controller('test_settings')
export class Test_settingsController {
  constructor(private readonly test_settingsService: Test_settingsService) {}

  @ApiOperation({ summary: 'Create a new test_settings' })
  @Post('/create')
  create(
    @Body() test_settingsDto: Test_settingsDto,
    // @Headers() headers?: string,
  ) {
    // const auth_header = headers['authorization'];
    // const token = auth_header?.split(' ')[1];
    return this.test_settingsService.create(test_settingsDto);
  }

  @ApiOperation({ summary: 'Get test_settings by ID' })
  // @UseGuards(AuthGuard)
  @Get('/getById/:id/:class_name')
  getById(@Param('id') id: number, @Param('class_name') class_name: number) {
    return this.test_settingsService.getById(id);
  }

  @ApiOperation({ summary: 'Get all test_settingss' })
  // @UseGuards(AuthGuard)
  @Get('/getAll')
  getAll() {
    return this.test_settingsService.getAll();
  }

  @ApiOperation({ summary: 'Get test_settingss with pagination' })
  // @UseGuards(AuthGuard)
  @Get('pagination/:page')
  pagination(@Param('page') page: number) {
    return this.test_settingsService.pagination(page);
  }

  @ApiOperation({ summary: 'Update test_settings profile by ID' })
  // @UseGuards(AuthGuard)
  @Put('/:id')
  update(
    @Param('id') id: number,
    @Body() test_settingsDto: Test_settingsDto,
    @Headers('authorization') authHeader: string,
  ) {
    return this.test_settingsService.update(id, test_settingsDto);
  }

  @ApiOperation({ summary: 'Delete test_settings' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  deleteTest_settings(@Param('id') id: number) {
    return this.test_settingsService.delete(id);
  }
}
