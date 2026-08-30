import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Role } from '../../role/models/role.models';

interface UserStepAttributes {
  lesson_id: number;
  role_id: number;
}

@Table({ tableName: 'user_step' })
export class UserStep extends Model<UserStep, UserStepAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  role_id: number;

  @BelongsTo(() => Role)
  role: Role[];
}
