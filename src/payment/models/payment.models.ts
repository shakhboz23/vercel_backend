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

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  CLICK = 'click',
  PAYME = 'payme',
  UZUM = 'uzum',
  BANK = 'bank',
}

interface PaymentAttributes {
  user_id: number;
  course_id: number;
  amount: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  transaction_id?: string;
  comment?: string;
  monthly_payment: number;
  debt: number;
  due_date: Date;
  last_reminder_at: Date;
}

@Table({ tableName: 'payments' })
export class Payment extends Model<Payment, PaymentAttributes> {
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    onDelete: 'CASCADE',
  })
  user_id: number;

  @BelongsTo(() => User)
  user: User[];

  @ForeignKey(() => Course)
  @Column({
    type: DataType.INTEGER,
    onDelete: 'CASCADE',
  })
  course_id: number;

  @BelongsTo(() => Course)
  course: Course;

  @Column({
    type: DataType.DECIMAL,
  })
  amount: number;

  @Column({
    type: DataType.DECIMAL,
  })
  monthly_payment: number;

  @Column({
    type: DataType.DECIMAL,
  })
  debt: number;

  @Column({
    type: DataType.ENUM({
      values: Object.values(PaymentStatus),
    }),
    defaultValue: PaymentStatus.SUCCESS,
  })
  status: PaymentStatus;

  @Column({
    type: DataType.ENUM({
      values: Object.values(PaymentMethod),
    }),
    defaultValue: PaymentMethod.CASH,
  })
  payment_method: PaymentMethod;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  transaction_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  comment: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  due_date: Date;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  last_reminder_at: Date;
}
