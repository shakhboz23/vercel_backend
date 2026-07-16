import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  AttendanceDay,
  CourseSchedule,
} from './models/course_schedule.models';

@Injectable()
export class CourseScheduleService {
  constructor(
    @InjectModel(CourseSchedule)
    private readonly courseScheduleRepository: typeof CourseSchedule,
  ) {}

  async create(
    course_id: number,
    attendanceDays: AttendanceDay[],
  ): Promise<CourseSchedule[]> {
    if (!attendanceDays.length) {
      return [];
    }

    const existingSchedules = await this.courseScheduleRepository.findAll({
      where: { course_id },
      attributes: ['attendance_day'],
    });
    const existingDays = new Set(
      existingSchedules.map((schedule) => schedule.attendance_day),
    );
    const newDays = attendanceDays.filter((day) => !existingDays.has(day));

    if (!newDays.length) {
      return [];
    }

    return this.courseScheduleRepository.bulkCreate(
      newDays.map((attendance_day) => ({
        course_id,
        attendance_day,
      })),
    );
  }

  async hasSameAttendanceDays(
    course_id: number,
    attendanceDays: AttendanceDay[],
  ): Promise<boolean> {
    const schedules = await this.courseScheduleRepository.findAll({
      where: { course_id },
      attributes: ['attendance_day'],
    });
    const existingDays = new Set(
      schedules.map((schedule) => schedule.attendance_day),
    );

    return (
      existingDays.size === attendanceDays.length &&
      attendanceDays.every((day) => existingDays.has(day))
    );
  }
}
