import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UploadedService } from './uploaded.service';
import { ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadedDto } from './dto/uploaded.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageValidationPipe } from '../pipes/image-validation.pipe';
import { UpdateDto } from './dto/update';

@ApiTags('Uploaded')
@Controller('uploaded')
export class UploadedController {
  constructor(private readonly uploadedService: UploadedService) { }

  @ApiOperation({ summary: 'Create a new video_lesson' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file_type: {
          type: 'string',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('/create')
  @UseInterceptors(FileInterceptor('file'))
  create(
    @UploadedFile(new ImageValidationPipe()) file: Express.Multer.File,
    @Body() body: { file_type: string },
  ) {
    console.log(file, '2323232');
    return this.uploadedService.create(file, body.file_type);
  }

  // @ApiOperation({ summary: 'Create a new video_lesson' })
  // @ApiConsumes('multipart/form-data')
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       is_active: {
  //         type: 'boolean',
  //       },
  //       file_type: {
  //         type: 'string',
  //       },
  //       duration: {
  //         type: 'number',
  //       },
  //       file: {
  //         type: 'string',
  //         // format: 'binary',
  //       },
  //     },
  //   },
  // })
  // @Post('/create')
  // @UseInterceptors(FileInterceptor('file'))
  // upload(
  //   @Body() uploadedDto: UploadedDto,
  //   @UploadedFile(new ImageValidationPipe()) file: Express.Multer.File
  //   )
  //   {
  //   return this.uploadedService.upload(uploadedDto, file);
  // }

  @ApiOperation({ summary: 'Get class by ID' })
  // @UseGuards(AuthGuard)
  @Get('/getById/:id/:class_name')
  getById(@Param('id') id: number) {
    return this.uploadedService.getById(id);
  }

  @ApiOperation({ summary: 'Cron' })
  // @UseGuards(AuthGuard)
  @Get('/cron')
  cron() {
    return "cron is working in vercel";
  }

  @ApiOperation({ summary: 'Get all classs' })
  // @UseGuards(AuthGuard)
  @Get()
  getAll() {
    return this.uploadedService.getAll();
  }

  @ApiOperation({ summary: 'Get classs with pagination' })
  // @UseGuards(AuthGuard)
  @Get('pagination/:page')
  pagination(@Param('page') page: number) {
    return this.uploadedService.pagination(page);
  }

  @ApiOperation({ summary: 'Update class profile by ID' })
  // @UseGuards(AuthGuard)
  @Put('/:id')
  update(@Param('id') id: number, @Body() updateDto: UpdateDto) {
    return this.uploadedService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete class' })
  // @UseGuards(AuthGuard)
  @Delete(':id')
  deleteUploaded(@Param('id') id: number) {
    return this.uploadedService.delete(id);
  }
}
