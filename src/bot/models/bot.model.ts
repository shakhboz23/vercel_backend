import { ApiProperty } from "@nestjs/swagger";
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { User } from "src/user/models/user.models";

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

    @ApiProperty({ example: "johndoe", description: 'username' })
    @Column({ type: DataType.STRING })
    username: string;

    @ApiProperty({ example: "John", description: 'first name' })
    @Column({ type: DataType.STRING })
    name: string;

    @ApiProperty({ example: "Doe", description: 'last name' })
    @Column({ type: DataType.STRING })
    surname: string;

    @ApiProperty({ example: "+998901234567", description: 'phone number' })
    @Column({ type: DataType.STRING })
    phone: string; 

    @ApiProperty({ example: "user active", description: 'status' })
    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    status: boolean;

    @ApiProperty({ example: "child_id", description: 'kutilayotgan javob turi' })
    @Column({ type: DataType.STRING, allowNull: true })
    step: string;

    @ApiProperty({ example: "12", description: "step bilan bog'liq qo'shimcha ma'lumot (masalan, dars ID)" })
    @Column({ type: DataType.STRING, allowNull: true })
    step_data: string;

    @ApiProperty({ example: "parent", description: "ro'yhatdan o'tayotgan rol: parent | student" })
    @Column({ type: DataType.STRING, allowNull: true })
    role: string;
}