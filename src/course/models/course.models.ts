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
import { Group } from '../../group/models/group.models';
import { Lesson } from '../../lesson/models/lesson.models';
import { Subscriptions } from 'src/subscriptions/models/subscriptions.models';
import { Category } from 'src/category/models/category.models';
import { User } from 'src/user/models/user.models';
import { SubscriptionActivity } from 'src/subscription_activity/models/subscription_activity.models';
import { ChatGroup } from 'src/chat_group/models/chat_group.models';

interface CourseAttributes {
  title: string;
  description: string;
  price: number;
  discount: number;
  cover: string;
  group_id: number;
  category_id: number;
  user_id: number
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
    type: DataType.STRING,
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

  @ForeignKey(() => Group)
  @Column({
    type: DataType.INTEGER,
  })
  group_id: number;

  @BelongsTo(() => Group)
  group: Group[];

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  user_id: number;

  @BelongsTo(() => User)
  user: User[];


  @ForeignKey(() => Category)
  @Column({
    type: DataType.INTEGER,
  })
  category_id: number;

  @BelongsTo(() => Category)
  category: Category[];

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

  // @BelongsToMany(() => User, {
  // through: { model: () => Subscriptions }, // Use a function to specify the model type
  // foreignKey: 'course_id'
  // })
  // users: User[];
}
