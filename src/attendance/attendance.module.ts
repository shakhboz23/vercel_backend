import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Attendance } from './models/attendance.models';

@Module({
  imports: [SequelizeModule.forFeature([Attendance])],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
