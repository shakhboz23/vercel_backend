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
import { Group } from '../../group/models/group.models';
import { Like } from 'src/likes/models/like.models';
import { Comment } from 'src/comment/models/comment.models';

interface LessonAttributes {
  title: string;
  course_id: number;
  lesson_id: number;
  published: boolean;
  video: string;
  content: string;
  type: lessonType;
  position: number;
  duration: number;
}

export enum lessonType {
  lesson = 'lesson',
  module = 'module',
}

@Table({ tableName: 'lesson' })
export class Lesson extends Model<Lesson, LessonAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.INTEGER,
  })
  position: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  title: string;

  @Column({
    type: DataType.STRING,
  })
  video: string;

  @Column({
    type: DataType.TEXT,
    defaultValue: '',
  })
  content: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  published: boolean;

  @Column({
    type: DataType.ENUM({
      values: Object.keys(lessonType),
    }),
    defaultValue: lessonType.lesson,
  })
  type: lessonType;

  @ForeignKey(() => Course)
  @Column({
    type: DataType.INTEGER,
  })
  course_id: number;

  @ForeignKey(() => Lesson)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  lesson_id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  duration: number;

  @BelongsTo(() => Course)
  course: Course[];

  @HasMany(() => Lesson, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  lessons: Lesson[];

  @HasMany(() => Like, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  likes: Like[];

  @HasMany(() => Comment, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  comments: Comment[];
}