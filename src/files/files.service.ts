import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { v4 } from 'uuid';
import { resolve, join } from 'path';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import cloudinary from '../../cloudinary.config';
import { Readable } from 'stream';

@Injectable()
export class FilesService {
  async createFile(file: any, file_type: string): Promise<string> {
    try {
      console.log(file);
      console.log(file.mimetype.split('/')[0]);
      // if (
      //   file.mimetype.split('/')[0] != file_type &&
      //   file_type != 'any' &&
      //   file_type != 'youtube'
      // ) {
      //   throw new HttpException(
      //     'File type not supported',
      //     HttpStatus.INTERNAL_SERVER_ERROR,
      //   );
      // }
      const fileTypeIndex = file?.originalname.lastIndexOf('.');
      const fileType = file?.originalname.slice(fileTypeIndex);
      const file_name = v4() + fileType;
      // const file_path = resolve(__dirname, '..', '..', 'static');
      // if (!existsSync(file_path)) {
      //   mkdirSync(file_path, { recursive: true });
      // }
      // writeFileSync(join(file_path, file_name), file.buffer);
      // const filePath: string = 'dist/static/' + file_name;
      let result: any;

      try {
        // result = await cloudinary.uploader.upload(filePath, {
        //   resource_type: 'auto',
        // });
        // Faylni to‘g‘ridan-to‘g‘ri Cloudinary'ga yuklash
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
        return 'error';
      }

      return result;
    } catch (error) {
      throw new HttpException(
        'Error creating file: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteFile(file_name: string) {
    try {
      unlinkSync(resolve(__dirname, '..', '..', 'static', file_name));
    } catch (error) {
      throw new HttpException(
        'Error deleting file: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
