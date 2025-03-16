import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Role } from '../../role/models/role.models';
import { Tests } from '../../test/models/test.models';
import { User } from 'src/user/models/user.models';
import { Lesson } from 'src/lesson/models/lesson.models';
import { Course } from 'src/course/models/course.models';
import { Group } from 'src/group/models/group.models';

interface WatchedAttributes {
  user_id: number;
  lesson_id: number;
  course_id: number;
  group_id: number;
}

@Table({ tableName: 'watched' })
export class Watched extends Model<Watched, WatchedAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    onDelete: 'CASCADE',
  })
  user_id: number;

  @BelongsTo(() => User)
  user: User[];

  @ForeignKey(() => Lesson)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    onDelete: 'CASCADE',
  })
  lesson_id: number;

  @BelongsTo(() => Lesson)
  lesson: Lesson[];

  @ForeignKey(() => Course)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    onDelete: 'CASCADE',
  })
  course_id: number;

  @BelongsTo(() => Course)
  course: Course[];

  @ForeignKey(() => Group)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    onDelete: 'CASCADE',
  })
  group_id: number;

  @BelongsTo(() => Group)
  group: Group[];
}
