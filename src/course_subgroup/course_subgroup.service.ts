import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CourseSubgroup } from './models/course_subgroup.models';
import { CourseScheduleService } from 'src/course_schedule/course_schedule.service';
import { AttendanceDay } from 'src/course_schedule/models/course_schedule.models';

export interface CourseSubgroupInput {
  id?: number;
  name: string;
  attendance_days: AttendanceDay[];
}

@Injectable()
export class CourseSubgroupService {
  constructor(
    @InjectModel(CourseSubgroup)
    private readonly courseSubgroupRepository: typeof CourseSubgroup,
    private readonly courseScheduleService: CourseScheduleService,
  ) {}

  // Reconciles a course's subgroups (and their weekday schedules) with the
  // given list: existing subgroups are matched by id and renamed/rescheduled
  // as needed, unmatched ones are created, and subgroups missing from the
  // list are removed (their subscriptions fall back to unassigned via
  // ON DELETE SET NULL rather than being deleted).
  async sync(
    course_id: number,
    subgroups: CourseSubgroupInput[],
  ): Promise<void> {
    const existing = await this.courseSubgroupRepository.findAll({
      where: { course_id },
    });
    const keepIds = new Set<number>();

    for (const input of subgroups) {
      let subgroup = input.id
        ? existing.find((s) => s.id === input.id)
        : undefined;

      if (!subgroup) {
        subgroup = await this.courseSubgroupRepository.create({
          course_id,
          name: input.name,
        });
      } else if (subgroup.name !== input.name) {
        await subgroup.update({ name: input.name });
      }

      keepIds.add(subgroup.id);
      await this.courseScheduleService.create(
        course_id,
        input.attendance_days,
        subgroup.id,
      );
    }

    const toRemove = existing.filter((s) => !keepIds.has(s.id));
    await Promise.all(toRemove.map((s) => s.destroy()));
  }
}
