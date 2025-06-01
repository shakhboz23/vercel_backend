import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Comment } from './models/comment.models';
import { InjectModel } from '@nestjs/sequelize';
import { CommentDto } from './dto/comment.dto';
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
export class CommentService {
  constructor(
    @InjectModel(Comment) private commentRepository: typeof Comment,
    private readonly userService: UserService,
    private uploadedService: UploadedService,
  ) { }

  async create(commentDto: CommentDto, user_id: number): Promise<object> {
    try {
      const comment = await this.commentRepository.create({ user_id, ...commentDto });
      return this.commentRepository.findOne({
        where: { id: comment.id },
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'surname', 'image'],
          },
        ],
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAll(group_id: number): Promise<object> {
    try {
      let comments: any = await this.commentRepository.findAll({
        include: [{ model: User }, {
          model: Lesson,
          include: [{
            model: Course, include: [{
              model: Group, where: { id: group_id }
            }]
          }]
        }],
        order: [[Sequelize.col('Comment.createdAt'), 'ASC']],
        attributes: {
          include: [
            [
              Sequelize.literal(
                `EXTRACT(EPOCH FROM "Comment"."createdAt")::int`
              ),
              'createdAt',
            ],
          ],
        },
      });
      if (!comments.length) {
        throw new NotFoundException('Comments not found');
      }

      const groupedByYearMonth = comments.reduce((acc, current) => {
        const createdAt = new Date(current.createdAt * 1000); // timestampni datega aylantiramiz
        const yearMonth = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}`; // Yil va oy formatida olish

        // Yil va oy bo'yicha guruhlash
        if (!acc[yearMonth]) {
          acc[yearMonth] = [];
        }
        acc[yearMonth].push(current);

        return acc;
      }, {});

      let commentsList = await this.pagination(1, group_id);


      comments = Object.keys(groupedByYearMonth).map((key, index) => {
        const [year, month] = key.split('-');
        const date = new Date(+year, +month - 1);

        return {
          index,
          yearMonth: key,
          timestamp: Math.floor(date.getTime()), // Sekundga aylantirish
          commentsList,
          commentsCount: groupedByYearMonth[key]?.length,
        };
      });
      return comments;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: number): Promise<object> {
    try {
      const comment = await this.commentRepository.findOne({
        where: { id },
        include: [{ model: Course }],
      });
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }
      return comment;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number, lesson_id: number): Promise<object> {
    try {
      console.log(lesson_id, 230303);
      const offset = (page - 1) * 10;
      const limit = 30;
      const comments = await this.commentRepository.findAll({
        where: { lesson_id },
        offset, limit,
        include: [{ model: User }],
        order: [['createdAt', 'DESC']],
      });
      const total_count = await this.commentRepository.count();
      const total_pages = Math.ceil(total_count / 10);
      return {
        records: comments,
        pagination: {
          currentPage: +page,
          total_pages,
          total_count,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: number, commentDto: CommentDto): Promise<object> {
    try {
      const comment = await this.commentRepository.findByPk(id);
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }
      const update = await this.commentRepository.update(commentDto, {
        where: { id },
        returning: true,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: {
          comment: update[1][0],
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<object> {
    try {
      const comment = await this.commentRepository.findByPk(id);
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }
      comment.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
