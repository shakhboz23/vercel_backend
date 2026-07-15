import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from '../../user/models/user.models';
import { Course } from 'src/course/models/course.models';

interface AttendanceAttributes {
  attendance: number;
  role: string;
  user_id: number;
  course_id: number;
}

export enum RoleName {
  student = 'student',
  teacher = 'teacher',
  admin = 'admin',
  super_admin = 'super_admin',
}

@Table({ tableName: 'attendance' })
export class Attendance extends Model<Attendance, AttendanceAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  attendance: number;

  @Column({
    type: DataType.STRING,
  })
  role: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  user_id: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Course)
  @Column({
    type: DataType.INTEGER,
  })
  course_id: number;

  @BelongsTo(() => Course)
  course: Course;
}
