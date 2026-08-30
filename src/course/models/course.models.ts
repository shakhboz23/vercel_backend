import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Lesson } from 'src/lesson/models/lesson.models';
import { Subscriptions } from 'src/subscriptions/models/subscriptions.models';
import { User } from 'src/user/models/user.models';
import { SubscriptionActivity } from 'src/subscription_activity/models/subscription_activity.models';
import { ChatGroup } from 'src/chat_group/models/chat_group.models';
import { Group } from 'src/group/models/group.models';
import { GroupType } from 'src/group/dto/group.dto';
import { SubCategory } from 'src/subcategory/models/subcategory.models';
import { PaymentStripe } from 'src/stripe/models/stripe.models';
import { CourseSchedule } from 'src/course_schedule/models/course_schedule.models';
import { Payment } from 'src/payment/models/payment.models';
import { CourseSubgroup } from 'src/course_subgroup/models/course_subgroup.models';

interface CourseAttributes {
  title: string;
  description: string;
  price: number;
  discount: number;
  cover: string;
  group_id: number;
  subcategory_id: number;
  user_id: number
  group_type: string;
  teacher_id: number;
  start_date: Date;
}

@Table({ tableName: 'course' })
export class Course extends Model<Course, CourseAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.TEXT,
  })
  description: string;

  @Column({
    type: DataType.DATE,
  })
  start_date: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  price: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  discount: number;

  @Column({
    type: DataType.STRING,
  })
  cover: string;

  @Column({
    type: DataType.ENUM({
      values: Object.keys(GroupType),
    }),
    defaultValue: GroupType.public,
  })
  group_type: GroupType;

  @ForeignKey(() => Group)
  @Column({
    type: DataType.INTEGER,
    onDelete: 'CASCADE',
  })
  group_id: number;

  @BelongsTo(() => Group)
  group: Group[];

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    onDelete: 'SET NULL',
  })
  user_id: number;

  @BelongsTo(() => User, {
    as: 'user',
    foreignKey: 'user_id',
  })
  user: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    onDelete: 'SET NULL',
  })
  teacher_id: number;

  @BelongsTo(() => User, {
    as: 'teacher',
    foreignKey: 'teacher_id',
  })
  teacher: User;


  @ForeignKey(() => SubCategory)
  @Column({
    type: DataType.INTEGER,
    onDelete: 'SET NULL',
  })
  subcategory_id: number;

  @BelongsTo(() => SubCategory)
  subcategory: SubCategory[];

  @HasMany(() => Lesson, {
    foreignKey: 'course_id',
    as: 'lessons',
    onDelete: 'CASCADE',
    hooks: true,
  })
  lessons: Lesson[];

  @HasMany(() => Subscriptions, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  subscriptions: Subscriptions[];

  @HasMany(() => SubscriptionActivity, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  subscriptionActivity: SubscriptionActivity;

  @HasMany(() => ChatGroup, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  chatGroup: ChatGroup[];

  @HasMany(() => Lesson, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  lesson: Lesson[];

  @HasMany(() => CourseSchedule, {
    onDelete: 'CASCADE',
    as: 'attendance_days',
    hooks: true,
  })
  attendance_days: CourseSchedule[];

  @HasMany(() => CourseSubgroup, {
    onDelete: 'CASCADE',
    as: 'subgroups',
    hooks: true,
  })
  subgroups: CourseSubgroup[];

  @HasMany(() => Payment, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  payments: Payment[];
}
