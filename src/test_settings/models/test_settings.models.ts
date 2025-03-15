import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Lesson } from '../../lesson/models/lesson.models';

interface Test_settingsAttributes {
  start_date: Date;
  end_date: Date;
  sort_level: any[];
  period: string;
  mix: boolean;
  lesson_id: number;
}

@Table({ tableName: 'test_settings' })
export class Test_settings extends Model<
  Test_settings,
  Test_settingsAttributes
> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.DATE,
  })
  start_date: Date;

  @Column({
    type: DataType.DATE,
  })
  end_date: Date;

  @Column({
    type: DataType.JSONB,
  })
  sort_level: any[];

  @Column({
    type: DataType.STRING,
  })
  period: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  mix: boolean;

  @ForeignKey(() => Lesson)
  @Column({
    type: DataType.INTEGER,
    unique: true,
    allowNull: true,
    onDelete: 'SET NULL',
  })
  lesson_id: number;

  @BelongsTo(() => Lesson)
  lesson: Lesson;
}
