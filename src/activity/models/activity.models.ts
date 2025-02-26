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

interface ActivityAttributes {
  activity: string;
  role: string;
  user_id: number;
}

export enum RoleName {
  student = 'student',
  teacher = 'teacher',
  admin = 'admin',
  super_admin = 'super_admin',
}

@Table({ tableName: 'activity' })
export class Activity extends Model<Activity, ActivityAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    defaultValue: '0',
  })
  activity: string;

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
  user: User[];
}
