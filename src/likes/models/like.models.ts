import { User } from './../../user/models/user.models';
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

interface LikeAttributes {
  lesson_id: number;
  user_id: number;
}

@Table({ tableName: 'likes' })
export class Like extends Model<Like, LikeAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Lesson)
  @Column({
    type: DataType.INTEGER,
  })
  lesson_id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  user_id: number;

  @BelongsTo(() => Lesson)
  lesson: Lesson[];

  @BelongsTo(() => User)
  user: User[];
}
