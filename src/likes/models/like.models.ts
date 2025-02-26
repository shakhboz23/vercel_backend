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
import { Course } from '../../course/models/course.models';

interface LikeAttributes {
  course_id: number;
  user_id: number;
}

@Table({ tableName: 'like' })
export class Like extends Model<Like, LikeAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Course)
  @Column({
    type: DataType.INTEGER,
  })
  course_id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  user_id: number;

  @BelongsTo(() => Course)
  course: Course[];

  @BelongsTo(() => User)
  user: User[];
}
