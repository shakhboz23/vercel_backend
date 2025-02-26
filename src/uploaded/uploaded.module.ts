import { Module } from '@nestjs/common';
import { UploadedService } from './uploaded.service';
import { UploadedController } from './uploaded.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Uploaded } from './models/uploaded.models';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [SequelizeModule.forFeature([Uploaded]), FilesModule],
  controllers: [UploadedController],
  providers: [UploadedService],
  exports: [UploadedService],
})
export class UploadedModule {}
