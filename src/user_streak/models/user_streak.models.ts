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

interface UserStreakAttributes {
  user_id: number;
  course_id: number;
  currentStreak: number;
  lastActivityDate: Date;
  season: number;
}

export enum RoleName {
  student = 'student',
  teacher = 'teacher',
  admin = 'admin',
  super_admin = 'super_admin',
}

@Table({ tableName: 'userStreak' })
export class UserStreak extends Model<UserStreak, UserStreakAttributes> {
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
  currentStreak: number;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  lastActivityDate: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  season: number;

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
