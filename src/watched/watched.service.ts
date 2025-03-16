import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Watched } from './models/watched.models';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { WatchedDto } from './dto/watched.dto';
import { Sequelize } from 'sequelize-typescript';
import { User } from 'src/user/models/user.models';
import { Lesson } from 'src/lesson/models/lesson.models';
import { Course } from 'src/course/models/course.models';
import { Group } from 'src/group/models/group.models';

@Injectable()
export class WatchedService {
  constructor(
    @InjectModel(Watched) private watchedRepository: typeof Watched,
  ) { }

  async create(watchedDto: WatchedDto, user_id: number): Promise<object> {
    let likeType: string = '';
    for (let i in watchedDto) {
      if (watchedDto[i]) {
        likeType = i;
      }
    }

    try {
      const is_watched = await this.watchedRepository.findOne({
        where: {
          user_id,
          [likeType]: watchedDto[likeType],
        },
      });
      if (!is_watched) {
        await this.watchedRepository.create({
          ...watchedDto,
          user_id,
        });
        return {
          statusCode: HttpStatus.OK,
          message: 'Successfully liked!',
        };
      } else {
        await this.watchedRepository.update({
          ...watchedDto,
          user_id,
        }, {
          where: {
            id: is_watched.id,
          },
          returning: true,
        }); return {
          statusCode: HttpStatus.OK,
          message: 'Successfully unliked!',
        };
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAll(user_id: number): Promise<object> {
    try {
      const watched = await this.watchedRepository.findAll({
        where: {
          user_id
        },
        include: [{ model: Lesson }, { model: Course }, { model: Group }]
      });
      return watched;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number, limit: number): Promise<object> {
    try {
      const offset = (page - 1) * limit;
      const watcheds = await this.watchedRepository.findAll({ offset, limit });
      const total_count = await this.watchedRepository.count();
      const total_pages = Math.ceil(total_count / limit);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: watcheds,
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


  async delete(id: number): Promise<object> {
    try {
      const watched = await this.watchedRepository.findByPk(id);
      if (!watched) {
        throw new NotFoundException('Watched not found');
      }
      watched.destroy();
      return {
        statusCode: HttpStatus.ACCEPTED,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
