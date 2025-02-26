import { Controller, Post, UploadedFile, UseInterceptors, Get, Query, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
// import { v2 as cloudinary } from 'cloudinary';
import cloudinary from '../../cloudinary.config';


@ApiTags('Cloudinary')
@Controller('videos')
export class VideoController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @ApiOperation({ summary: 'upload' })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadPrivateVideo(file.path);
    return { publicId: result.public_id, url: result.secure_url };
  }

  @ApiOperation({ summary: 'upload' })
  @Get('signature')
  async getVideoSignature(@Query('publicId') publicId: string) {
    const signatureData = this.cloudinaryService.generateVideoSignature(publicId);
    return signatureData;
  }

  @ApiOperation({ summary: 'upload' })
  @Post('get-signed-url')
  async getSignedUrl(@Body() body: { public_id: string; format: string; resource_type: string }) {
    const url = cloudinary.url(body.public_id, {
      resource_type: body.resource_type,
      type: 'authenticated',
      sign_url: true,
      format: body.format,
    });

    return { url };
  }
}
