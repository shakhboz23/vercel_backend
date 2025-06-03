import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubCategory } from './models/subcategory.models';
import { InjectModel } from '@nestjs/sequelize';
import { SubCategoryDto } from './dto/subcategory.dto';

@Injectable()
export class SubCategoryService {
  constructor(
    @InjectModel(SubCategory) private categoryRepository: typeof SubCategory,
  ) {}

  async create(categoryDto: SubCategoryDto): Promise<object> {
    try {
      const subCategory: any = await this.categoryRepository.create(categoryDto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Created successfully',
        data: subCategory,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAll(): Promise<object> {
    try {
      const subCategory: any = await this.categoryRepository.findAll({
        order: [['subCategory', 'ASC']],
      });
      if (subCategory.IsNotEmpty) {
        throw new NotFoundException('SubCategory not found');
      }
      return subCategory;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: number): Promise<object> {
    try {
      const subCategory: any = await this.categoryRepository.findOne({
        where: { id },
      });
      if (subCategory.IsNotEmpty) {
        throw new NotFoundException('SubCategory not found');
      }
      return {
        statusCode: HttpStatus.OK,
        data: subCategory,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number): Promise<object> {
    try {
      const offset = (page - 1) * 10;
      const limit = 10;
      const subCategory = await this.categoryRepository.findAll({ offset, limit });
      const total_count = await this.categoryRepository.count();
      const total_pages = Math.ceil(total_count / 10);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: subCategory,
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

  async update(id: number, categoryDto: SubCategoryDto): Promise<object> {
    try {
      const subCategory: any = await this.categoryRepository.findByPk(id);
      if (subCategory.IsNotEmpty) {
        throw new NotFoundException('SubCategory not found');
      }
      const update = await this.categoryRepository.update(categoryDto, {
        where: { id },
        returning: true,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: {
          subCategory: update[1][0],
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<object> {
    try {
      const subCategory = await this.categoryRepository.findByPk(id);
      if (!subCategory) {
        throw new NotFoundException('SubCategory not found');
      }
      subCategory.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
