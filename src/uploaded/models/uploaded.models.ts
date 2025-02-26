import {
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
// import { Video_lesson } from '../video_lesson/models/video_lesson.models';

interface UploadedAttributes {
  status: boolean;
  duration: number;
  file_type: string;
  url: string;
}

@Table({ tableName: 'uploaded' })
export class Uploaded extends Model<Uploaded, UploadedAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.INTEGER,
  })
  duration: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  file_type: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  url: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  status: boolean;
}
