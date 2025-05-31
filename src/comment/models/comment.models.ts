import { User } from '../../user/models/user.models';
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

interface CommentAttributes {
  comment: string;
  lesson_id: number;
  user_id: number;
}

@Table({ tableName: 'comments' })
export class Comment extends Model<Comment, CommentAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.TEXT,
  })
  comment: string;

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
