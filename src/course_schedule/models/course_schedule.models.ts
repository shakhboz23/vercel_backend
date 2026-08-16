import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Course } from 'src/course/models/course.models';
import { CourseSubgroup } from 'src/course_subgroup/models/course_subgroup.models';

export enum AttendanceDay {
  mon = 'Mon',
  tue = 'Tue',
  wed = 'Wed',
  thu = 'Thu',
  fri = 'Fri',
  sat = 'Sat',
  sun = 'Sun',
}

interface CourseScheduleAttributes {
  course_id: number;
  subgroup_id?: number | null;
  attendance_day: AttendanceDay[];
}

@Table({ tableName: 'course_schedule' })
export class CourseSchedule extends Model<
  CourseSchedule,
  CourseScheduleAttributes
> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Course)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onDelete: 'CASCADE',
  })
  course_id: number;

  // NULL means this schedule applies to the whole course. Set when the
  // course is split into subgroups that each meet on different weekdays.
  @ForeignKey(() => CourseSubgroup)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    onDelete: 'CASCADE',
  })
  subgroup_id: number | null;

  @BelongsTo(() => CourseSubgroup)
  subgroup: CourseSubgroup;

  @Column({
    type: DataType.ARRAY(DataType.STRING(3)),
    allowNull: false,
    validate: {
      isValidAttendanceDays(value: AttendanceDay[]) {
        if (
          !Array.isArray(value) ||
          !value.length ||
          value.some((day) => !Object.values(AttendanceDay).includes(day))
        ) {
          throw new Error(
            'attendance_day must be a non-empty array of valid weekdays',
          );
        }
      },
    },
  })
  attendance_day: AttendanceDay[];

  @BelongsTo(() => Course)
  course: Course;
}
