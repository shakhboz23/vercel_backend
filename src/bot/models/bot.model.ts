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

interface BotAttr {
  user_id: number;
  bot_id: number;
  username: string;
  name: string;
  surname: string;
  phone: string;
  status: boolean;
  step?: string;
  step_data?: string;
  role?: string;
  parent_name?: string;
  parent_surname?: string;
  student_name?: string;
  student_surname?: string;
}

@Table({ tableName: 'bot' })
export class Bot extends Model<Bot, BotAttr> {
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  user_id: number;

  @BelongsTo(() => User)
  user: User[];

  @ApiProperty({ example: 123456789, description: 'user_id' })
  @Column({ type: DataType.BIGINT, primaryKey: true, allowNull: false })
  bot_id: number;

  @ApiProperty({ example: 'johndoe', description: 'username' })
  @Column({ type: DataType.STRING })
  username: string;

  @ApiProperty({ example: 'John', description: 'first name' })
  @Column({ type: DataType.STRING })
  name: string;

  @ApiProperty({ example: 'Doe', description: 'last name' })
  @Column({ type: DataType.STRING })
  surname: string;

  @ApiProperty({ example: '+998901234567', description: 'phone number' })
  @Column({ type: DataType.STRING })
  phone: string;

  @ApiProperty({ example: 'user active', description: 'status' })
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  status: boolean;

  @ApiProperty({ example: 'child_id', description: 'kutilayotgan javob turi' })
  @Column({ type: DataType.STRING, allowNull: true })
  step: string;

  @ApiProperty({
    example: '12',
    description: "step bilan bog'liq qo'shimcha ma'lumot (masalan, dars ID)",
  })
  @Column({ type: DataType.STRING, allowNull: true })
  step_data: string;

  @ApiProperty({
    example: 'parent',
    description: "ro'yhatdan o'tayotgan rol: parent | student",
  })
  @Column({ type: DataType.STRING, allowNull: true })
  role: string;

  @ApiProperty({
    example: 'Alisher',
    description: "'parent' roli uchun saqlangan ism",
  })
  @Column({ type: DataType.STRING, allowNull: true })
  parent_name: string;

  @ApiProperty({
    example: 'Aliyev',
    description: "'parent' roli uchun saqlangan familiya",
  })
  @Column({ type: DataType.STRING, allowNull: true })
  parent_surname: string;

  @ApiProperty({
    example: 'Bekzod',
    description: "'student' roli uchun saqlangan ism",
  })
  @Column({ type: DataType.STRING, allowNull: true })
  student_name: string;

  @ApiProperty({
    example: 'Bekzodov',
    description: "'student' roli uchun saqlangan familiya",
  })
  @Column({ type: DataType.STRING, allowNull: true })
  student_surname: string;
}
