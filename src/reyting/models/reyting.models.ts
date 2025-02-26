import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Role } from '../../role/models/role.models';
import { Tests } from '../../test/models/test.models';
import { User } from 'src/user/models/user.models';
import { Lesson } from 'src/lesson/models/lesson.models';

interface ReytingAttributes {
  user_id: number;
  ball: number;
  lesson_id: number;
}

@Table({ tableName: 'reyting' })
export class Reyting extends Model<Reyting, ReytingAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  ball: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  user_id: number;

  @BelongsTo(() => User)
  user: User[];

  @ForeignKey(() => Lesson)
  @Column({
    type: DataType.INTEGER,
  })
  lesson_id: number;

  @BelongsTo(() => Lesson)
  test: Lesson[];
}
