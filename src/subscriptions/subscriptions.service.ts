import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubscribeActive, Subscriptions } from './models/subscriptions.models';
import { InjectModel } from '@nestjs/sequelize';
import { SubscriptionsDto } from './dto/subscriptions.dto';
import { Tests } from '../test/models/test.models';
import { Uploaded } from '../uploaded/models/uploaded.models';
import { UserService } from '../user/user.service';
import { Course } from '../course/models/course.models';
import { UploadedService } from '../uploaded/uploaded.service';
import { CreateSubscriptionsDto } from './dto/create_subscriptions.dto';
import { Response } from 'express';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscriptions)
    private subscriptionsRepository: typeof Subscriptions,
    private readonly userService: UserService,
    private uploadedService: UploadedService,
  ) { }

  async create(
    subscriptionsDto: SubscriptionsDto,
    user_id: number,
  ): Promise<object> {
    try {
      const { course_id } = subscriptionsDto;
      const exist = await this.subscriptionsRepository.findOne({
        where: { user_id, course_id },
      });
      if (exist) {
        return this.delete(user_id, subscriptionsDto.course_id);
        // throw new BadRequestException('Already created');
      } 
      return this.subscriptionsRepository.create({ course_id, user_id, is_active: SubscribeActive.requested });
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async createSubscription(
    creaetSubscriptionsDto: CreateSubscriptionsDto,
    user_id: number,
  ): Promise<object> {
    try {
      const user: any = await this.userService.register(
        { ...creaetSubscriptionsDto, role: 'student' },
      );
      console.log(user);
      const { course_ids, role } = creaetSubscriptionsDto;
      user_id = user.data?.user.id;
      // const exist = await this.subscriptionsRepository.findOne({
      //   where: { user_id, course_ids },
      // });
      // if (exist) {
      //   throw new BadRequestException('Already created');
      // }
      let subcription: any;
      let i: any;
      for (i of course_ids) {
        subcription = await this.subscriptionsRepository.create({ course_id: i, user_id, role, is_active: SubscribeActive.pending });
      }
      return subcription;
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

      const subscriptionss: any = await this.subscriptionsRepository.findAll({
        order: [['id', 'ASC']],
      });
      if (!subscriptionss.length) {
        throw new NotFoundException('Subscriptionss not found');
      }
      return subscriptionss;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getByUserId(user_id): Promise<object> {
    try {
      const subscriptionss: any = await this.subscriptionsRepository.findAll({
        where: {
          user_id,
        },
        include: [{ model: Course }],
      });
      if (!subscriptionss.length) {
        throw new NotFoundException('Subscriptionss not found');
      }
      return subscriptionss;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(id: number): Promise<object> {
    try {
      const subscriptions = await this.subscriptionsRepository.findOne({
        where: { id },
        include: [{ model: Course }],
      });
      if (!subscriptions) {
        throw new NotFoundException('Subscriptions not found');
      }
      return subscriptions;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number): Promise<object> {
    try {
      const offset = (page - 1) * 10;
      const limit = 10;
      const subscriptionss = await this.subscriptionsRepository.findAll({
        offset,
        limit,
      });
      const total_count = await this.subscriptionsRepository.count();
      const total_pages = Math.ceil(total_count / 10);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: subscriptionss,
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
    subscriptionsDto: SubscriptionsDto,
  ): Promise<object> {
    try {
      const subscriptions = await this.subscriptionsRepository.findByPk(id);
      if (!subscriptions) {
        throw new NotFoundException('Subscriptions not found');
      }
      const update = await this.subscriptionsRepository.update(
        subscriptionsDto,
        {
          where: { id },
          returning: true,
        },
      );
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: {
          subscriptions: update[1][0],
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(user_id: number, course_id: number): Promise<object> {
    try {
      const subscriptions = await this.subscriptionsRepository.findOne({
        where: { user_id, course_id }
      });
      if (!subscriptions) {
        throw new NotFoundException('Subscriptions not found');
      }
      subscriptions.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
