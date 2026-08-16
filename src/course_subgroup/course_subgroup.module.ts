import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CourseSubgroup } from './models/course_subgroup.models';
import { CourseSubgroupService } from './course_subgroup.service';
import { CourseScheduleModule } from 'src/course_schedule/course_schedule.module';

@Module({
  imports: [SequelizeModule.forFeature([CourseSubgroup]), CourseScheduleModule],
  providers: [CourseSubgroupService],
  exports: [CourseSubgroupService],
})
export class CourseSubgroupModule {}
