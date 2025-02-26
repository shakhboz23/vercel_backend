import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserStep } from './models/class.models';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { UserStepDto } from './dto/class.dto';
import { Role } from '../role/models/role.models';
import { Lesson } from '../lesson/models/lesson.models';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class UserStepService {
  constructor(
    @InjectModel(UserStep) private classRepository: typeof UserStep,
    private readonly jwtService: JwtService,
  ) {}

  async create(UserStepDto: UserStepDto): Promise<object> {
    try {
      const { lesson_id, role_id } = UserStepDto;
      const exist = await this.classRepository.findOne({
        where: { role_id },
      });
      if (exist) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Already created',
        };
      }
      const id = await this.classRepository.create(UserStepDto);

      return {
        statusCode: HttpStatus.OK,
        message: 'Created successfully',
        data: id,
      };
    } catch (error) {
      // throw new BadRequestException(error.message);
      return error.message;
    }
  }

  async getAll(): Promise<object> {
    try {
      const classs = await this.classRepository.findAll({
        order: [
          // ['class_number', 'ASC'],
          // ['name', 'ASC'],
        ],
        include: [{ model: Role }],
      });
      return {
        statusCode: HttpStatus.OK,
        data: classs,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: number): Promise<object> {
    try {
      const classs = await this.classRepository.findByPk(id, {
        include: [{ model: Lesson }],
      });
      return {
        statusCode: HttpStatus.OK,
        data: classs,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getByClass(
    subject_id: number,
    class_number: number,
    role_id: number,
  ): Promise<object> {
    try {
      const user_step = await this.classRepository.findAll({
        include: {
          model: Lesson,
          where: {
            class: class_number,
            subject_id,
          },
          attributes: [],
        },
        order: [['lesson_id', 'ASC']],
      });
      return {
        statusCode: HttpStatus.OK,
        data: user_step,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number): Promise<object> {
    try {
      const offset = (page - 1) * 10;
      const limit = 10;
      const classs = await this.classRepository.findAll({ offset, limit });
      const total_count = await this.classRepository.count();
      const total_pages = Math.ceil(total_count / 10);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: classs,
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

  async update(id: number, UserStepDto: UserStepDto): Promise<object> {
    try {
      const classes = await this.classRepository.findByPk(id);
      if (!classes) {
        throw new NotFoundException('Class not found');
      }
      const update = await this.classRepository.update(UserStepDto, {
        where: { id },
        returning: true,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: {
          class: update[1][0],
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<object> {
    try {
      const classes = await this.classRepository.findByPk(id);
      if (!classes) {
        throw new NotFoundException('Class not found');
      }
      classes.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
