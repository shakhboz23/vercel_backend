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
import { LikeService } from 'src/likes/like.service';

@Injectable()
export class WatchedService {
  constructor(
    @InjectModel(Watched) private watchedRepository: typeof Watched,
    private readonly likeService: LikeService,
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

  async getAll(user_id: number, type: string, analytics_id: number): Promise<object> {
    try {
      let watched: any = await this.watchedRepository.findAll({
        where: {
          [type]: { [Op.ne]: null },
        },
        order: [[Sequelize.col('Watched.createdAt'), 'ASC']],
        include: [{ model: User }, {
          model: Lesson,
          // required: type == 'lesson_id' ? true : false,
          // where: { user_id },
        }, {
          model: Course, required: type == 'course_id' ? true : false,
          where: {
            user_id,
            ...(analytics_id && analytics_id != 0 ? { id: analytics_id } : {}),
          },
        }, {
          model: Group, required: type == 'group_id' ? true : false,
          where: {
            user_id,
            ...(analytics_id && analytics_id != 0 ? { id: analytics_id } : {}),
          },
        }],
        attributes: {
          include: [
            [
              Sequelize.literal(
                `EXTRACT(EPOCH FROM "Watched"."createdAt")::int`
              ),
              'createdAt',
            ],
          ],
        },
      });
      let likes: any
      if (type == 'group_id') {
        likes = await this.likeService.getAll(analytics_id);
      }

      const groupedByYearMonth = watched.reduce((acc, current) => {
        const createdAt = new Date(current.createdAt * 1000); // timestampni datega aylantiramiz
        const yearMonth = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}`; // Yil va oy formatida olish

        // Yil va oy bo'yicha guruhlash
        if (!acc[yearMonth]) {
          acc[yearMonth] = [];
        }
        acc[yearMonth].push(current);

        return acc;
      }, {});

      let watchedList = await this.pagination(analytics_id, user_id, type, 1);

      watched = Object.keys(groupedByYearMonth).map((key, index) => {
        const [year, month] = key.split('-');
        const date = new Date(+year, +month - 1);

        return {
          index,
          yearMonth: key,
          timestamp: Math.floor(date.getTime()), // Sekundga aylantirish
          watchedList,
          watchedCount: groupedByYearMonth[key]?.length,
        };
      });
      return { watched, likes };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(analytics_id: number, user_id: number, type: string, page: number, limit?: number): Promise<object> {
    try {
      limit = limit || 10;
      const offset = (page - 1) * limit;
      const watched = await this.watchedRepository.findAll({
        order: [[Sequelize.col('Watched.createdAt'), 'ASC']],
        offset, limit, include: [{ model: User }, {
          model: Lesson,
          // required: type == 'lesson_id' ? true : false,
          // where: { user_id },
        }, {
          model: Course, required: type == 'course_id' ? true : false,
          where: {
            user_id,
            ...(analytics_id && analytics_id != 0 ? { id: analytics_id } : {}),
          },
        }, {
          model: Group, required: type == 'group_id' ? true : false,
          where: {
            user_id,
            ...(analytics_id && analytics_id != 0 ? { id: analytics_id } : {}),
          },
        }],
      });
      const total_count = await this.watchedRepository.count();
      const total_pages = Math.ceil(total_count / limit);
      return {
        records: watched,
        pagination: {
          currentPage: Number(page),
          total_pages,
          total_count,
        },
      };
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
