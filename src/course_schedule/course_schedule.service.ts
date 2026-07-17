import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AttendanceDay, CourseSchedule } from './models/course_schedule.models';

@Injectable()
export class CourseScheduleService {
  constructor(
    @InjectModel(CourseSchedule)
    private readonly courseScheduleRepository: typeof CourseSchedule,
  ) {}

  async create(
    course_id: number,
    attendanceDays: AttendanceDay[],
  ): Promise<CourseSchedule | null> {
    if (!attendanceDays.length) {
      return null;
    }

    const currentSchedule = await this.courseScheduleRepository.findOne({
      where: { course_id },
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    if (
      currentSchedule &&
      this.hasSameDays(currentSchedule.attendance_day, attendanceDays)
    ) {
      return null;
    }

    // Schedules are immutable so createdAt records when this version took effect.
    return this.courseScheduleRepository.create({
      course_id,
      attendance_day: attendanceDays,
    });
  }

  async hasSameAttendanceDays(
    course_id: number,
    attendanceDays: AttendanceDay[],
  ): Promise<boolean> {
    const currentSchedule = await this.courseScheduleRepository.findOne({
      where: { course_id },
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    return (
      !!currentSchedule &&
      this.hasSameDays(currentSchedule.attendance_day, attendanceDays)
    );
  }

  private hasSameDays(
    existingDays: AttendanceDay[],
    attendanceDays: AttendanceDay[],
  ): boolean {
    return (
      existingDays.length === attendanceDays.length &&
      existingDays.every((day) => attendanceDays.includes(day))
    );
  }
}
