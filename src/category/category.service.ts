import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category } from './models/category.models';
import { InjectModel } from '@nestjs/sequelize';
import { CategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category) private categoryRepository: typeof Category,
  ) {}

  async create(categoryDto: CategoryDto): Promise<object> {
    try {
      const category: any = await this.categoryRepository.create(categoryDto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Created successfully',
        data: category,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAll(): Promise<object> {
    try {
      const category: any = await this.categoryRepository.findAll({
        order: [['category', 'ASC']],
      });
      if (category.IsNotEmpty) {
        throw new NotFoundException('Category not found');
      }
      return category;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: number): Promise<object> {
    try {
      const category: any = await this.categoryRepository.findOne({
        where: { id },
      });
      if (category.IsNotEmpty) {
        throw new NotFoundException('Category not found');
      }
      return {
        statusCode: HttpStatus.OK,
        data: category,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number): Promise<object> {
    try {
      const offset = (page - 1) * 10;
      const limit = 10;
      const category = await this.categoryRepository.findAll({ offset, limit });
      const total_count = await this.categoryRepository.count();
      const total_pages = Math.ceil(total_count / 10);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: category,
          pagination: {
            currentPage: page,
            total_pages,
            total_count,
          },
        },
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }   

  async update(id: number, categoryDto: CategoryDto): Promise<object> {
    try {
      const category: any = await this.categoryRepository.findByPk(id);
      if (category.IsNotEmpty) {
        throw new NotFoundException('Category not found');
      }
      const update = await this.categoryRepository.update(categoryDto, {
        where: { id },
        returning: true,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: {
          category: update[1][0],
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<object> {
    try {
      const category = await this.categoryRepository.findByPk(id);
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      category.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
