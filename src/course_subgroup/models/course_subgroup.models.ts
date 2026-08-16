import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Course } from 'src/course/models/course.models';
import { CourseSchedule } from 'src/course_schedule/models/course_schedule.models';

interface CourseSubgroupAttributes {
  course_id: number;
  name: string;
}

@Table({ tableName: 'course_subgroup' })
export class CourseSubgroup extends Model<
  CourseSubgroup,
  CourseSubgroupAttributes
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

  @BelongsTo(() => Course)
  course: Course;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  name: string;

  @HasMany(() => CourseSchedule, {
    onDelete: 'CASCADE',
    as: 'schedules',
    hooks: true,
  })
  schedules: CourseSchedule[];
}
