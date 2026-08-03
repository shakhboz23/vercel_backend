import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Attendance } from './models/attendance.models';
import { ReytingModule } from 'src/reyting/reyting.module';
import { UserStreakModule } from 'src/user_streak/user_streak.module';

@Module({
  imports: [SequelizeModule.forFeature([Attendance]), UserStreakModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
