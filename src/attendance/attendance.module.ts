import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Attendance } from './models/attendance.models';
import { ReytingModule } from 'src/reyting/reyting.module';
import { UserStreakModule } from 'src/user_streak/user_streak.module';
import { Course } from 'src/course/models/course.models';
import { BotModule } from 'src/bot/bot.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Attendance, Course]),
    UserStreakModule,
    BotModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
