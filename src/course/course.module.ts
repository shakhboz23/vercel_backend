import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Course } from './models/course.models';
import { UserModule } from '../user/user.module';
import { UploadedModule } from '../uploaded/uploaded.module';
import { ChatGroupModule } from 'src/chat_group/chat_group.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Course]),
    UserModule, UploadedModule, ChatGroupModule,
  ],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule { }
