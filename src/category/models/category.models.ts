import {
  BelongsTo,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { SubCategory } from 'src/subcategory/models/subcategory.models';

interface CategoryAttributes {
  icon: string;
  title: string;
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
  })
  icon: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  title: string;

  @HasMany(() => SubCategory, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  subcategories: SubCategory[];
}
