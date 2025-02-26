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
}