import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { v4 } from 'uuid';
import { resolve, join } from 'path';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import cloudinary from '../../cloudinary.config';
import { Readable } from 'stream';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class FilesService {
  constructor(private readonly cloudinaryService: CloudinaryService) { }

  async createFile(file: any, file_type: string): Promise<string> {
    try {
      const fileTypeIndex = file?.originalname.lastIndexOf('.');
      const fileType = file?.originalname.slice(fileTypeIndex);
      const file_name = v4() + fileType;
      let result: any;

      try {
        result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );

          Readable.from(file.buffer).pipe(stream);
        });
      } catch (error) {
        console.log(error);
      }

      return result;
    } catch (error) {
      throw new HttpException(
        'Error creating file: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteFile(fileUrl: string) {
    const result = await this.cloudinaryService.deleteFileByUrl(fileUrl);
    console.log(result);
    return result;
  }
}
