import {
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';

interface CategoryAttributes {
  category: string;
}

@Table({ tableName: 'category' })
export class Category extends Model<Category, CategoryAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  category: string;
}
