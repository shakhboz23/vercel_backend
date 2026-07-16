import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CourseSchedule } from './models/course_schedule.models';
import { CourseScheduleService } from './course_schedule.service';

@Module({
  imports: [SequelizeModule.forFeature([CourseSchedule])],
  providers: [CourseScheduleService],
  exports: [CourseScheduleService],
})
export class CourseScheduleModule {}
