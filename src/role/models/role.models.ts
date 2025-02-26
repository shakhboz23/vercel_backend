import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Reyting } from '../../reyting/models/reyting.models';
import { User } from '../../user/models/user.models';

interface RoleAttributes {
  user_id: number;
  role: string;
}

export enum GenderType {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

@Table({ tableName: 'role' })
export class Role extends Model<Role, RoleAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;


  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: true })
  subjects: string[];

  @Column(
    DataType.ENUM({
      values: Object.keys(GenderType),
    }),
  )
  gender: GenderType;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  get_answered: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  new_task: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  chat_messages: boolean;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  test_reyting: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  user_id: number;

  @BelongsTo(() => User)
  user: User[];

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  role: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  hashed_password: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  last_activity: Date;
}
