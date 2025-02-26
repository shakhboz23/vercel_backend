import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Test_settings } from './models/test_settings.models';
import { InjectModel } from '@nestjs/sequelize';
import { Test_settingsDto } from './dto/test_settings.dto';

@Injectable()
export class Test_settingsService {
  constructor(
    @InjectModel(Test_settings)
    private test_settingsRepository: typeof Test_settings,
  ) { }

  async create(test_settingsDto: Test_settingsDto): Promise<object> {
    try {
      const { lesson_id } = test_settingsDto;
      let test_settings = await this.test_settingsRepository.findOne({
        where: { lesson_id }
      })
      if (test_settings) {
        return this.update(test_settings.id, test_settingsDto);
      }
      if (!lesson_id) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Lesson id not found',
        };
      }
      test_settings =
        await this.test_settingsRepository.create(test_settingsDto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Created successfully',
        data: test_settings,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAll(): Promise<object> {
    try {
      const test_settingss = await this.test_settingsRepository.findAll();
      return {
        statusCode: HttpStatus.OK,
        data: test_settingss,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: number): Promise<object> {
    try {
      const test_settings = await this.test_settingsRepository.findByPk(
        id,
        // where: { [Op.and]: [{ class: class_name }, { id: id }] },
        // include: [
        //   { model: Tests, attributes: ['id'] },
        // ],
      );
      if (!test_settings) {
        throw new NotFoundException('Test_settings not found');
      }
      return {
        statusCode: HttpStatus.OK,
        data: test_settings,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getByLessonId(id: number): Promise<object> {
    try {
      const test_settings = await this.test_settingsRepository.findOne({
        where: { lesson_id: id },
      });
      // if (!test_settings) {
      //   return {
      //     message: "Test settings not found"
      //   }
      // }
      return test_settings;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number): Promise<object> {
    try {
      const offset = (page - 1) * 10;
      const limit = 10;
      const test_settingss = await this.test_settingsRepository.findAll({
        offset,
        limit,
      });
      const total_count = await this.test_settingsRepository.count();
      const total_pages = Math.ceil(total_count / 10);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: test_settingss,
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

  async update(
    id: number,
    test_settingsDto: Test_settingsDto,
  ): Promise<object> {
    try {
      const test_settings = await this.test_settingsRepository.findByPk(id);
      if (!test_settings) {
        throw new BadRequestException('Test_settings not found');
      }
      const update = await this.test_settingsRepository.update(
        test_settingsDto,
        {
          where: { id },
          returning: true,
        },
      );
      return update[1][0];
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<object> {
    try {
      const test_settings = await this.test_settingsRepository.findByPk(id);
      if (!test_settings) {
        throw new NotFoundException('Test_settings not found');
      }
      test_settings.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
