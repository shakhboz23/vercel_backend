import { User } from '../../user/models/user.models';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
import { Course } from '../../course/models/course.models';
import { SubscriptionActivity } from 'src/subscription_activity/models/subscription_activity.models';
import { RoleName } from 'src/activity/models/activity.models';

interface SubscriptionsAttributes {
  course_id: number;
  user_id: number;
  role: RoleName;
  is_active: SubscribeActive;
}


export enum SubscribeActive {
  // not_found = 'not_found',
  requested = 'requested',
  pending = 'pending',
  active = 'active',
}

@Table({ tableName: 'subscriptions' })
export class Subscriptions extends Model<Subscriptions, SubscriptionsAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.ENUM({
      values: Object.keys(RoleName),
    }),
    defaultValue: RoleName.student
  })
  role: RoleName;

  @ForeignKey(() => Course)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  course_id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id: number;

  @BelongsTo(() => Course)
  course: Course[];

  @BelongsTo(() => User)
  user: User[];

  @Column(
    DataType.ENUM({
      values: Object.keys(SubscribeActive),
    }),
  )
  is_active: SubscribeActive;

  @HasOne(() => SubscriptionActivity, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  subscriptionActivity: SubscriptionActivity;
}
