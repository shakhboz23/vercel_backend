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

@Injectable()
export class LikeService {
  constructor(
    @InjectModel(Like) private likeRepository: typeof Like,
    private readonly userService: UserService,
    private uploadedService: UploadedService,
  ) {}

  async create(likeDto: LikeDto): Promise<object> {
    try {
      const { user_id, course_id } = likeDto;
      const exist = await this.likeRepository.findOne({
        where: { user_id, course_id },
      });
      if (exist) {
        throw new BadRequestException('Already created');
      }
      return this.likeRepository.create(likeDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAll(): Promise<object> {
    try {
      // const user_data: any = await this.userService.getById(user_id);
      // if (!user_data) {
      //   new BadRequestException('User not found!');
      // }

      const likes: any = await this.likeRepository.findAll({
        order: [['id', 'ASC']],
      });
      if (!likes.length) {
        throw new NotFoundException('Likes not found');
      }
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

  async pagination(page: number): Promise<object> {
    try {
      const offset = (page - 1) * 10;
      const limit = 10;
      const likes = await this.likeRepository.findAll({ offset, limit });
      const total_count = await this.likeRepository.count();
      const total_pages = Math.ceil(total_count / 10);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: likes,
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
