import { Module } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Lesson } from './models/lesson.models';
import { UserModule } from '../user/user.module';
import { UploadedModule } from '../uploaded/uploaded.module';
import { CourseModule } from 'src/course/course.module';
import { ReytingModule } from 'src/reyting/reyting.module';
import { WatchedModule } from 'src/watched/watched.module';
import { FilesModule } from 'src/files/files.module';
import { CommentModule } from 'src/comment/comment.module';

@Module({
  imports: [SequelizeModule.forFeature([Lesson]), CourseModule, UploadedModule, ReytingModule, WatchedModule, FilesModule, CommentModule, ],
  controllers: [LessonController],
  providers: [LessonService],
  exports: [LessonService],
})
export class LessonModule { }
