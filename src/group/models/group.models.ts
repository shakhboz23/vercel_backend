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
import { Course } from 'src/course/models/course.models';
import { ChatGroup } from 'src/chat_group/models/chat_group.models';
import { GroupType } from '../dto/group.dto';

interface GroupAttributes {
  title: string;
  description: string;
  cover: string;
  user_id: number;
  group_type: string;
}

@Table({ tableName: 'group' })
export class Group extends Model<Group, GroupAttributes> {
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
    type: DataType.STRING,
  })
  cover: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  user_id: number;

  @Column({
    type: DataType.ENUM({
      values: Object.keys(GroupType),
    }),
    defaultValue: GroupType.public,
  })
  group_type: GroupType;

  @BelongsTo(() => User)
  user: User[];

  // @HasMany(() => Lesson, {
  //   onDelete: 'CASCADE',
  //   hooks: true,
  // })
  // lesson: Lesson[];

  @HasMany(() => Course, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  course: Course[];

  @HasMany(() => ChatGroup, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  chatGroup: ChatGroup[];
}
