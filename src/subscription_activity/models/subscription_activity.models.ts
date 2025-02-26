import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Activity } from '../../activity/models/activity.models';
import { Chat } from '../../chat/models/chat.model';
import { Role } from '../../role/models/role.models';
import { Reyting } from 'src/reyting/models/reyting.models';
import { Subscriptions } from 'src/subscriptions/models/subscriptions.models';
import { Course } from 'src/course/models/course.models';

interface SubscriptionActivityAttributes {
  subscription_id: number;
  status: SubscriptionActivityStatus;
  course_id: number;
  createdAt?: Date;
}

export enum SubscriptionActivityStatus {
  none = 'none',
  bad = 'bad',
  good = 'good',
  average = 'average',
  excellent = 'excellent',
}

@Table({ tableName: 'subscription_activity' })
export class SubscriptionActivity extends Model<SubscriptionActivity, SubscriptionActivityAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.ENUM({
      values: Object.keys(SubscriptionActivityStatus),
    }),
    defaultValue: SubscriptionActivityStatus.none,
  })
  status: SubscriptionActivityStatus;

  @Column({
    type: DataType.DATE,
  })
  createdAt: Date;

  @ForeignKey(() => Subscriptions)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  subscription_id: number;

  @BelongsTo(() => Subscriptions)
  subcription: Subscriptions[];

  @ForeignKey(() => Course)
  @Column({
    type: DataType.INTEGER,
  })
  course_id: number;

  @BelongsTo(() => Course)
  course: Course[];
}
