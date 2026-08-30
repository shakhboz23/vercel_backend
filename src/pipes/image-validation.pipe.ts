import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { extname } from 'path';

@Injectable()
export class ImageValidationPipe implements PipeTransform<any> {
  transform(value: any) {
    try {
      if (value) {
        const file = value?.originalname;
        const fileExtension = extname(file).toLowerCase();
        return value;
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
