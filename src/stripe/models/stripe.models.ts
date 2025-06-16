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
import { User } from 'src/user/models/user.models';

interface StripeAttributes {
  user_id: number;
  course_id: number;
  amount: number;
  status: string;
  stripe_id: string;
}

export enum PaymentStatus {
  pending = 'pending',
  completed = 'completed',
  failed = 'failed',
}

@Table({ tableName: 'stripe' })
export class StripePay extends Model<StripePay, StripeAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

   @Column({
    type: DataType.STRING,
    defaultValue: 0,
  })
  stripe_id: string;

  @Column(
    DataType.ENUM({
      values: Object.keys(PaymentStatus),
    }),
  )
  status: PaymentStatus;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  amount: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  user_id: number;

  @BelongsTo(() => User)
  user: User[];
  
  @ForeignKey(() => Course)
  @Column({
    type: DataType.INTEGER,
  })
  course_id: number;

  @BelongsTo(() => Course)
  course: Course[];
}
