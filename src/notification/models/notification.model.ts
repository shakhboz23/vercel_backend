import { IsBoolean, IsOptional } from 'class-validator';
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

interface NotificationAttr {
  type: string;
  user_id: number;
  is_read?: boolean;
  is_accepted?: boolean;
}

@Table({ tableName: 'notification' })
export class Notification extends Model<Notification, NotificationAttr> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  type: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  user_id: number;

  @BelongsTo(() => User)
  user: User[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_read: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_accepted: boolean;
}
