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
import { Lesson } from 'src/lesson/models/lesson.models';
import { Subscriptions } from 'src/subscriptions/models/subscriptions.models';
import { Category } from 'src/category/models/category.models';
import { User } from 'src/user/models/user.models';
import { SubscriptionActivity } from 'src/subscription_activity/models/subscription_activity.models';
import { ChatGroup } from 'src/chat_group/models/chat_group.models';
import { Group } from 'src/group/models/group.models';
import { GroupType } from 'src/group/dto/group.dto';
import { SubCategory } from 'src/subcategory/models/subcategory.models';
// import { StripePay } from 'src/stripe/models/stripe.models';

interface CourseAttributes {
  title: string;
  description: string;
  price: number;
  discount: number;
  cover: string;
  group_id: number;
  category_id: number;
  user_id: number
  group_type: string;
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
    unique: true,
  })
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  description: string;

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

  @BelongsTo(() => User)
  user: User[];


  @ForeignKey(() => SubCategory)
  @Column({
    type: DataType.INTEGER,
    onDelete: 'SET NULL',
  })
  subcategory_id: number;

  @BelongsTo(() => SubCategory)
  subcategory: SubCategory[];

  @HasMany(() => Lesson, {
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

  // @HasMany(() => StripePay, {
  //   onDelete: 'CASCADE',
  //   hooks: true,
  // })
  // payment: StripePay[];

  // @BelongsToMany(() => User, {
  // through: { model: () => Subscriptions }, // Use a function to specify the model type
  // foreignKey: 'course_id'
  // })
  // users: User[];
}
