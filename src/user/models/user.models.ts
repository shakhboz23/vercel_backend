import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Activity } from '../../activity/models/activity.models';
import { Chat } from '../../chat/models/chat.model';
import { Role } from '../../role/models/role.models';
import { Reyting } from 'src/reyting/models/reyting.models';
// import { Bot } from 'src/bot/models/bot.model';

interface UserAttributes {
  name: string;
  surname: string;
  email: string;
  // phone: string;
  current_role: string;
  bio: string;
  is_active: boolean;
  is_online: boolean;
  last_activity: Date;
  image: string;
  hashed_password: string;
  hashed_refresh_token: string;
}

export enum RoleName {
  student = 'student',
  teacher = 'teacher',
  super_admin = 'super_admin'
}

@Table({ tableName: 'user' })
export class User extends Model<User, UserAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    // unique: true,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    // unique: true,
  })
  surname: string;

  @Column({
    type: DataType.STRING,
    // unique: true,
  })
  email: string;

  // @Column({
  //   type: DataType.STRING,
  //   unique: true,
  // })
  // phone: string;

  @Column({
    type: DataType.STRING,
  })
  bio: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_active: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_online: boolean;

  @Column({
    type: DataType.STRING,
  })
  current_role: string;

  @Column({
    type: DataType.STRING,
  })
  hashed_password: string;

  @Column({
    type: DataType.STRING,
  })
  hashed_refresh_token: string;

  @Column({
    type: DataType.STRING,
  })
  activation_link: string;

  @HasMany(() => Chat, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  chats: Chat[];

  @HasMany(() => Role, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  role: Role[];

  @HasMany(() => Activity, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  activity: Activity[];

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  last_activity: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  image: string;

  // @HasMany(() => Subscriptions, {
  //   onDelete: 'CASCADE',
  //   hooks: true,
  // })
  // subscriptions: Subscriptions[];

  @HasMany(() => Reyting, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  reyting: Reyting[];
 
  // @HasMany(() => Bot, {
  //   onDelete: 'CASCADE',
  //   hooks: true,
  // })
  // bot: Bot[];

  // @BelongsToMany(() => Course, {
  //   through: { model: () => Subscriptions }, // Use a function to specify the model type
  //   foreignKey: 'user_id',
  // })
  // courses: Course[];
}
