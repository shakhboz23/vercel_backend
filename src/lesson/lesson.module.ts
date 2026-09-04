import { forwardRef, Module } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Lesson } from './models/lesson.models';
import { UploadedModule } from '../uploaded/uploaded.module';
import { CourseModule } from 'src/course/course.module';
import { ReytingModule } from 'src/reyting/reyting.module';
import { WatchedModule } from 'src/watched/watched.module';
import { FilesModule } from 'src/files/files.module';
import { CommentModule } from 'src/comment/comment.module';
import { Reyting } from 'src/reyting/models/reyting.models';
import { Tests } from 'src/test/models/test.models';
import { Subscriptions } from 'src/subscriptions/models/subscriptions.models';
import { Course } from 'src/course/models/course.models';
import { BotModule } from 'src/bot/bot.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Lesson, Reyting, Tests, Subscriptions, Course]),
    CourseModule,
    UploadedModule,
    WatchedModule,
    FilesModule,
    CommentModule,
    forwardRef(() => BotModule),
  ],
  controllers: [LessonController],
  providers: [LessonService],
  exports: [LessonService],
})
export class LessonModule {}
