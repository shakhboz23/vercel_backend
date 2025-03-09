import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Lesson } from '../../lesson/models/lesson.models';
import { Test_settings } from '../../test_settings/models/test_settings.models';

interface TestsAttributes {
  lesson_id: number;
  question: string;
  variants: string[];
  true_answer: number[];
  type: TestType;
}

export enum TestType {
  variant = 'variant',
  multiple = 'multiple',
  fill = 'fill',
  customizable = 'customizable',
  deleted = 'deleted',
}

export enum ActionType {
  old = 'old',
  new = 'new',
  deleted = 'deleted',
  edited = 'edited',
}

@Table({ tableName: 'tests' })
export class Tests extends Model<Tests, TestsAttributes> {
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

  @BelongsTo(() => Lesson)
  lesson: Lesson[];

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  question: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: false,
  })
  variants: string[];

  @Column({
    type: DataType.ARRAY(DataType.INTEGER),
    allowNull: false,
  })
  true_answer: number[];

  @Column({
    type: DataType.ENUM({
      values: Object.keys(TestType),
    }),
    defaultValue: TestType.variant,
  })
  type: TestType;
}
