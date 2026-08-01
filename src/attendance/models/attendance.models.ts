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
import { Lesson } from 'src/lesson/models/lesson.models';

interface AttendanceAttributes {
  attendance: number;
  role: string;
  user_id: number;
  lesson_id: number;
  date: Date;
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
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  date: Date;

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

  @ForeignKey(() => Lesson)
  @Column({
    type: DataType.INTEGER,
  })
  lesson_id: number;

  @BelongsTo(() => Lesson)
  lesson: Lesson;
}
