import { GetActivityDto } from './dto/get_activity.dto';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Activity } from './models/activity.models';
import { InjectModel } from '@nestjs/sequelize';
import { ActivityDto } from './dto/activity.dto';
import { Op } from 'sequelize';
import { Role } from '../role/models/role.models';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity) private activityRepository: typeof Activity,
  ) {}

  async create(activityDto: ActivityDto): Promise<object> {
    try {
      return {
        statusCode: HttpStatus.OK,
        message: 'Successfully created!',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAll(): Promise<object> {
    try {
      const users = await this.activityRepository.findAll();
      return {
        statusCode: HttpStatus.OK,
        data: users,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getActivity(getActivityDto: GetActivityDto): Promise<object> {
    try {
      const { role, user_id, start_time, end_time } = getActivityDto;
      const users = await this.activityRepository.findAll({
        where: {
          role,
          user_id,
          createdAt: {
            [Op.lte]: start_time,
            [Op.gte]: end_time,
          },
        },
      });
      return {
        statusCode: HttpStatus.OK,
        data: users,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: string): Promise<object> {
    try {
      const user = await this.activityRepository.findByPk(id, {
        include: { model: Role },
      });
      if (!user) {
        throw new NotFoundException('User topilmadi!');
      }
      return {
        statusCode: HttpStatus.OK,
        data: user,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number, limit: number): Promise<object> {
    try {
      const offset = (page - 1) * limit;
      const users = await this.activityRepository.findAll({ offset, limit });
      const total_count = await this.activityRepository.count();
      const total_pages = Math.ceil(total_count / limit);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: users,
          pagination: {
            currentPage: Number(page),
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

  async deleteUser(id: string): Promise<object> {
    try {
      const user = await this.activityRepository.findByPk(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      user.destroy();
      return {
        statusCode: HttpStatus.ACCEPTED,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
