import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/user/models/user.models';

interface BotChildAttr {
  parent_bot_id: number;
  student_id: number;
}

@Table({ tableName: 'bot_child' })
export class BotChild extends Model<BotChild, BotChildAttr> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({
    example: 123456789,
    description: 'ota-onaning telegram id si',
  })
  @Column({ type: DataType.BIGINT, allowNull: false })
  parent_bot_id: number;

  @ApiProperty({ example: 125, description: "o'quvchining id si" })
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  student_id: number;

  @BelongsTo(() => User)
  student: User;
}
