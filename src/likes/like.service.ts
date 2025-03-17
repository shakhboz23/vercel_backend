import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Like } from './models/like.models';
import { InjectModel } from '@nestjs/sequelize';
import { LikeDto } from './dto/like.dto';
import { Tests } from '../test/models/test.models';
import { Uploaded } from '../uploaded/models/uploaded.models';
import { UserService } from '../user/user.service';
import { Course } from '../course/models/course.models';
import { UploadedService } from '../uploaded/uploaded.service';
import { Sequelize } from 'sequelize-typescript';
import { Lesson } from 'src/lesson/models/lesson.models';
import { Group } from 'src/group/models/group.models';
import { User } from 'src/user/models/user.models';

@Injectable()
export class LikeService {
  constructor(
    @InjectModel(Like) private likeRepository: typeof Like,
    private readonly userService: UserService,
    private uploadedService: UploadedService,
  ) { }

  async create(likeDto: LikeDto, user_id: number): Promise<object> {
    try {
      const { lesson_id } = likeDto;
      const exist = await this.likeRepository.findOne({
        where: { user_id, lesson_id },
      });
      if (exist) {
        return this.delete(exist.id);
        // throw new BadRequestException('Already created');
      }
      return this.likeRepository.create({ lesson_id, user_id });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAll(group_id: number): Promise<object> {
    try {
      let likes: any = await this.likeRepository.findAll({
        include: [{ model: User }, {
          model: Lesson,
          include: [{
            model: Course, include: [{
              model: Group, where: { id: group_id }
            }]
          }]
        }],
        order: [[Sequelize.col('Like.createdAt'), 'ASC']],
        attributes: {
          include: [
            [
              Sequelize.literal(
                `EXTRACT(EPOCH FROM "Like"."createdAt")::int`
              ),
              'createdAt',
            ],
          ],
        },
      });
      if (!likes.length) {
        throw new NotFoundException('Likes not found');
      }

      const groupedByYearMonth = likes.reduce((acc, current) => {
        const createdAt = new Date(current.createdAt * 1000); // timestampni datega aylantiramiz
        const yearMonth = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}`; // Yil va oy formatida olish

        // Yil va oy bo'yicha guruhlash
        if (!acc[yearMonth]) {
          acc[yearMonth] = [];
        }
        acc[yearMonth].push(current);

        return acc;
      }, {});

      let likesList = await this.pagination(1, group_id);


      likes = Object.keys(groupedByYearMonth).map((key, index) => {
        const [year, month] = key.split('-');
        const date = new Date(+year, +month - 1);

        return {
          index,
          yearMonth: key,
          timestamp: Math.floor(date.getTime()), // Sekundga aylantirish
          likesList,
          likesCount: groupedByYearMonth[key]?.length,
        };
      });
      return likes;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: number): Promise<object> {
    try {
      const like = await this.likeRepository.findOne({
        where: { id },
        include: [{ model: Course }],
      });
      if (!like) {
        throw new NotFoundException('Like not found');
      }
      return like;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number, group_id: number): Promise<object> {
    try {
      const offset = (page - 1) * 10;
      const limit = 10;
      const likes = await this.likeRepository.findAll({
        offset, limit,
        include: [{ model: User }, {
          model: Lesson,
          include: [{
            model: Course, include: [{
              model: Group, where: { id: group_id }
            }]
          }]
        }],
      });
      const total_count = await this.likeRepository.count();
      const total_pages = Math.ceil(total_count / 10);
      return {
        records: likes,
        pagination: {
          currentPage: page,
          total_pages,
          total_count,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: number, likeDto: LikeDto): Promise<object> {
    try {
      const like = await this.likeRepository.findByPk(id);
      if (!like) {
        throw new NotFoundException('Like not found');
      }
      const update = await this.likeRepository.update(likeDto, {
        where: { id },
        returning: true,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: {
          like: update[1][0],
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<object> {
    try {
      const like = await this.likeRepository.findByPk(id);
      if (!like) {
        throw new NotFoundException('Like not found');
      }
      like.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
