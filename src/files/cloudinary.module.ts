import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { CloudinaryService } from './cloudinary.service';

@Module({
  // imports: [
  //   clodum
  // ],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
